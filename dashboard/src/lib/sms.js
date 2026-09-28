import { etapesDe } from './examens.js';
import { examenDe, heure, jour, nomComplet } from './patient.js';
import { resume } from './declarations.js';

const HEURE = 3600 * 1000;

/**
 * Limite des solides : six heures avant l'examen. Quand elle tombe dans la nuit,
 * la consigne réelle est « la veille au soir, avant minuit » — personne ne dîne à 3 h.
 */
export function limiteSolides(patient) {
  const d = new Date(new Date(patient.examen.date).getTime() - 6 * HEURE);
  return d.getHours() < 7 ? 'minuit la veille' : heure(d);
}

/** Remplit un modèle de SMS avec le dossier et l'identité du cabinet. */
export function rediger(modele, patient, cabinet) {
  const date = new Date(patient.examen.date);
  const valeurs = {
    cabinet: cabinet.nomCourt,
    examen: examenDe(patient).article,
    date: jour(date),
    heure: heure(date),
    limite: heure(date.getTime() - 2 * HEURE),
    limiteSolides: limiteSolides(patient),
    lieu: patient.examen.lieu,
    tel: cabinet.telephone,
    lien: `endova.fr/p/${patient.token}`,
  };
  return modele.replace(/\{(\w+)\}/g, (m, k) => valeurs[k] ?? m);
}

/**
 * Plan d'envoi : un SMS par étape, à l'heure calculée depuis l'examen.
 *
 * Un SMS n'est délivré que par le scan SMS (ou un envoi manuel) : il laisse alors
 * un événement `sms_envoye` dans le dossier. Échu mais pas encore scanné, il est
 * « à envoyer ». Le reste du statut se lit dans le dossier.
 */
export function planSms(patient, cabinet, maintenant = new Date()) {
  const etapes = etapesDe(patient);
  const evts = patient.evenements ?? [];
  const ouvertures = evts.filter((e) => e.type === 'lien_ouvert').map((e) => new Date(e.at));

  return etapes.map((etape, i) => {
    const envoi = etape.envoi(patient);
    const livraison = evts.find((e) => e.type === 'sms_envoye' && e.etape === etape.id);
    const delivre = livraison ? new Date(livraison.at) : null;
    const suivant = etapes[i + 1]?.envoi(patient) ?? new Date(patient.examen.date);
    const e = patient.etapes[etape.id];
    let statut = 'planifie';
    if (e?.done) statut = 'repondu';
    else if (delivre) statut = ouvertures.some((d) => d >= delivre && d < suivant) ? 'ouvert' : 'envoye';
    else if (envoi <= maintenant) statut = 'a_envoyer';
    return {
      etape,
      cle: etape.cle(patient),
      envoi,
      delivre,
      texte: rediger(etape.sms, patient, cabinet),
      statut,
      reponse: e?.done ? { at: e.at, ...resume(patient, etape.id) } : null,
    };
  });
}

export const STATUTS_SMS = {
  planifie: { label: 'Programmé', ton: 'neutre' },
  a_envoyer: { label: 'À envoyer — lancez le scan', ton: 'ruby' },
  envoye: { label: 'Délivré, non ouvert', ton: 'amber' },
  ouvert: { label: 'Lien ouvert', ton: 'marque' },
  repondu: { label: 'Répondu', ton: 'emerald' },
};

/**
 * Ce que le scan SMS doit délivrer maintenant : tous les messages échus et pas
 * encore partis, pour les patients dont l'examen n'est pas passé. Le jour J,
 * Endova passe la main : plus rien ne part après l'heure d'examen.
 */
export function smsEchus(patients, cabinet, maintenant = new Date()) {
  return patients
    .filter((p) => new Date(p.examen.date) > maintenant)
    .flatMap((p) => planSms(p, cabinet, maintenant).filter((s) => s.statut === 'a_envoyer').map((s) => ({ ...s, patient: p })))
    .sort((a, b) => a.envoi - b.envoi);
}

/** Le prochain SMS à partir, tous patients confondus. */
export function prochainsEnvois(patients, cabinet, maintenant = new Date(), fenetreH = 24) {
  return patients
    .flatMap((p) => planSms(p, cabinet, maintenant).filter((s) => s.statut === 'planifie').map((s) => ({ ...s, patient: p })))
    .filter((s) => s.envoi - maintenant <= fenetreH * HEURE)
    .sort((a, b) => a.envoi - b.envoi);
}

export const CATEGORIES = {
  sms: { label: 'SMS', ton: 'marque' },
  patient: { label: 'Patient', ton: 'emerald' },
  cabinet: { label: 'Cabinet', ton: 'neutre' },
  alerte: { label: 'Alerte', ton: 'ruby' },
};

const LIBELLES = {
  dossier_cree: 'Dossier créé',
  lien_ouvert: 'Lien ouvert, identité vérifiée',
  appel: 'Appel du secrétariat',
  action: 'Action corrective',
  sms_libre: 'Message libre envoyé',
  sms_renvoye: 'SMS renvoyé',
  sms_envoye: 'SMS délivré',
  modification: 'Dossier modifié',
  checklist: 'Check-list pré-examen',
  alerte_traitee: 'Alerte traitée',
};

const CATEGORIE_EVT = {
  dossier_cree: 'cabinet',
  lien_ouvert: 'patient',
  appel: 'cabinet',
  action: 'cabinet',
  sms_libre: 'sms',
  sms_renvoye: 'sms',
  sms_envoye: 'sms',
  modification: 'cabinet',
  checklist: 'cabinet',
  alerte_traitee: 'alerte',
};

/**
 * Journal complet du dossier, du plus récent au plus ancien : événements saisis,
 * SMS partis et déclarations du patient. C'est la preuve de l'information délivrée.
 */
export function chronologie(patient, cabinet, maintenant = new Date()) {
  const saisis = (patient.evenements ?? []).map((e) => ({
    at: e.at,
    categorie: CATEGORIE_EVT[e.type] ?? 'cabinet',
    titre: e.titre ?? LIBELLES[e.type] ?? e.type,
    detail: e.detail ?? null,
    auteur: e.auteur ?? (e.type === 'lien_ouvert' ? nomComplet(patient) : cabinet.utilisateur),
    ton: e.ton ?? null,
  }));

  const plan = planSms(patient, cabinet, maintenant);

  const declarations = plan
    .filter((s) => s.reponse?.at)
    .map((s) => ({
      at: s.reponse.at,
      categorie: 'patient',
      titre: `Déclaration ${s.cle} — ${s.etape.titre}`,
      detail: s.reponse.texte,
      auteur: nomComplet(patient),
      ton: s.reponse.ton,
    }));

  return [...saisis, ...declarations].sort((a, b) => new Date(b.at) - new Date(a.at));
}
