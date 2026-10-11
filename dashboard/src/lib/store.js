import { useSyncExternalStore } from 'react';
import { semer, CABINET_SEED } from './seed.js';
import { smsEchus } from './sms.js';
import { supabaseConfigure } from './supabase.js';
import { chargerEtat, enregistrerDossier, enregistrerCabinet, ajouterEvenements } from './distant.js';

/**
 * Persistance locale + diffusion inter-onglets.
 *
 * La démonstration n'a pas de back-end : la PWA patient et le logiciel du cabinet
 * tournent dans deux onglets du même navigateur et se synchronisent par
 * BroadcastChannel. L'API reste volontairement étroite pour qu'un adaptateur
 * serveur puisse s'y substituer sans toucher l'interface.
 */
// v3 : dossier structuré, SMS délivrés par le scan (événements `sms_envoye`).
// Les données v1 ne se convertissent pas proprement : on repart du jeu de démo.
const CLE = 'endova.dossiers.v3';
// Numéro de la graine : à incrémenter dès que `semer()` change de contenu.
const GRAINE = 2;
const canal = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('endova') : null;

let etat = charger();
const abonnes = new Set();

function neuf() {
  return { patients: semer(), cabinet: structuredClone(CABINET_SEED), graine: GRAINE };
}

/**
 * Le jeu de démonstration est daté par rapport au jour où il a été semé. Une
 * fois enregistré dans le navigateur il ne bouge plus : quelques jours plus
 * tard tous ses examens sont passés, et le tableau de bord — qui ne montre que
 * ce qui est à venir — se vide entièrement. On le resème donc quand il a
 * vieilli, ou quand la graine a changé de contenu.
 *
 * Une seule réserve, mais elle est absolue : si le cabinet a créé le moindre
 * dossier, on ne touche à rien. Mieux vaut une démonstration périmée qu'un
 * jeu de faux patients réinjecté dans de vraies données.
 */
function rafraichir(etat) {
  const frais = semer();
  const demo = new Set(frais.map((p) => p.id));
  const patients = etat.patients ?? [];
  if (patients.some((p) => !demo.has(p.id))) return etat;

  const perime = etat.graine !== GRAINE
    || (patients.length > 0 && patients.every((p) => new Date(p.examen.date) < new Date()));
  if (!perime) return etat;

  return { patients: frais, cabinet: etat.cabinet ?? structuredClone(CABINET_SEED), graine: GRAINE };
}

function charger() {
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) return rafraichir(JSON.parse(brut));
  } catch {
    // Mode privé ou stockage bloqué : on repart du jeu de démonstration.
  }
  return neuf();
}

function persister() {
  try {
    localStorage.setItem(CLE, JSON.stringify(etat));
  } catch {
    // Sans persistance l'état reste en mémoire : l'app fonctionne, elle oublie au rechargement.
  }
}

function diffuser(local = true) {
  abonnes.forEach((fn) => fn());
  if (local) canal?.postMessage({ type: 'sync', etat });
}

canal?.addEventListener('message', (e) => {
  if (e.data?.type === 'sync') {
    etat = e.data.etat;
    diffuser(false);
  }
});

/**
 * Mode distant. La mémoire reste la vérité de l'écran — l'interface est
 * synchrone et le restera — mais chaque écriture est poussée vers la base.
 * Les envois ne sont pas attendus : une latence réseau ne doit pas figer une
 * saisie. Un échec est retenu dans `dernierSouci` plutôt qu'avalé.
 */
let distant = null;          // { cabinetId } une fois la session ouverte
let dernierSouci = null;
const journauxPousses = new WeakMap();

function pousser(promesse) {
  promesse?.catch((e) => {
    dernierSouci = e.message;
    diffuser();
  });
}

function pousserDossier(id) {
  if (!distant) return;
  const p = etat.patients.find((x) => x.id === id);
  if (!p) return;
  pousser(enregistrerDossier(p, distant.cabinetId));
  // Le journal est en append-only : on n'envoie que les lignes jamais parties.
  const deja = journauxPousses.get(p) ?? 0;
  const neufs = (p.evenements ?? []).slice(deja);
  journauxPousses.set(p, (p.evenements ?? []).length);
  pousser(ajouterEvenements(id, neufs));
}

function ecrire(next) {
  etat = next;
  if (!distant) persister();
  diffuser();
}

const maintenant = () => new Date().toISOString();

/** Applique `fn` au seul dossier `id`. */
function surPatient(id, fn) {
  ecrire({ ...etat, patients: etat.patients.map((p) => (p.id === id ? fn(p) : p)) });
  pousserDossier(id);
}

const avecEvenement = (p, evt) => ({
  ...p,
  evenements: [...(p.evenements ?? []), { at: maintenant(), auteur: evt.auteur ?? etat.cabinet.utilisateur, ...evt }],
});

/**
 * Le jeton du lien SMS. Seize caractères tirés du générateur cryptographique :
 * les six caractères de `Math.random()` précédents se parcouraient en entier,
 * ce qui était sans conséquence tant que tout vivait dans le navigateur, et
 * ne l'est plus du tout dès que le dossier est posé sur un serveur.
 */
function jeton() {
  const octets = new Uint8Array(8);
  crypto.getRandomValues(octets);
  return [...octets].map((o) => o.toString(16).padStart(2, '0')).join('');
}

export const store = {
  /**
   * Passe en mode distant : l'état vient de la base et y retourne.
   * Renvoie `'sans-cabinet'` quand le compte n'est rattaché à aucun cabinet —
   * un tableau vide se prendrait pour une panne, il faut le dire.
   */
  async ouvrirSession() {
    if (!supabaseConfigure) return 'local';
    dernierSouci = null;
    try {
      const charge = await chargerEtat();
      if (!charge) return 'sans-cabinet';
      distant = { cabinetId: charge.cabinet.id };
      for (const p of charge.patients) journauxPousses.set(p, (p.evenements ?? []).length);
      etat = charge;
      diffuser();
      return 'distant';
    } catch (e) {
      dernierSouci = e.message;
      diffuser();
      return 'erreur';
    }
  },

  /** Retour au jeu local, sans laisser de dossiers du cabinet derrière soi. */
  fermerSession() {
    distant = null;
    etat = neuf();
    diffuser();
  },

  dernierSouci() {
    return dernierSouci;
  },

  subscribe(fn) {
    abonnes.add(fn);
    return () => abonnes.delete(fn);
  },
  get() {
    return etat;
  },

  /** Déclaration du patient depuis sa PWA. */
  majEtape(id, etapeId, valeurs) {
    surPatient(id, (p) => ({
      ...p,
      etapes: { ...p.etapes, [etapeId]: { ...p.etapes[etapeId], ...valeurs, done: true, at: maintenant() } },
    }));
  },

  creerPatient(dossier) {
    // Un UUID : c'est ce que la base attend comme clé primaire.
    const id = crypto.randomUUID();
    const numero = `GE-${new Date().getFullYear()}-${String(etat.patients.length + 1).padStart(4, '0')}`;
    const patient = {
      ...dossier,
      id,
      token: jeton(),
      numero,
      etapes: {},
      alertesTraitees: {},
      evenements: [{ at: maintenant(), type: 'dossier_cree', auteur: etat.cabinet.utilisateur, detail: 'Échéancier SMS programmé' }],
    };
    ecrire({ ...etat, patients: [...etat.patients, patient] });
    pousserDossier(id);
    return id;
  },

  /** Modifie une ou plusieurs sections du dossier et trace la modification. */
  majDossier(id, sections, evt) {
    surPatient(id, (p) => {
      const next = { ...p };
      for (const [k, v] of Object.entries(sections)) next[k] = { ...p[k], ...v };
      return evt ? avecEvenement(next, evt) : next;
    });
  },

  journaliser(id, evt) {
    surPatient(id, (p) => avecEvenement(p, evt));
  },

  traiterAlerte(id, alerte, note) {
    surPatient(id, (p) =>
      avecEvenement(
        { ...p, alertesTraitees: { ...p.alertesTraitees, [alerte.code]: { at: maintenant(), auteur: etat.cabinet.utilisateur, note } } },
        { type: 'alerte_traitee', titre: `Alerte traitée — ${alerte.titre}`, detail: note || alerte.action },
      ),
    );
  },

  rouvrirAlerte(id, alerte) {
    surPatient(id, (p) => {
      const reste = { ...p.alertesTraitees };
      delete reste[alerte.code];
      return avecEvenement({ ...p, alertesTraitees: reste }, { type: 'alerte_traitee', titre: `Alerte rouverte — ${alerte.titre}` });
    });
  },

  /**
   * Scan SMS : délivre d'un coup tous les messages échus, patient par patient,
   * et trace chaque envoi. Renvoie la liste de ce qui est parti.
   */
  scannerSms() {
    const lot = smsEchus(etat.patients, etat.cabinet);
    if (!lot.length) return [];
    const at = maintenant();
    const auteur = `Scan SMS · expéditeur ${etat.cabinet.expediteur}`;
    const parPatient = new Map();
    for (const s of lot) {
      const evt = { at, type: 'sms_envoye', etape: s.etape.id, titre: `SMS ${s.cle} délivré — ${s.etape.titre}`, detail: s.texte, auteur };
      parPatient.set(s.patient.id, [...(parPatient.get(s.patient.id) ?? []), evt]);
    }
    ecrire({
      ...etat,
      patients: etat.patients.map((p) => (parPatient.has(p.id) ? { ...p, evenements: [...(p.evenements ?? []), ...parPatient.get(p.id)] } : p)),
    });
    return lot;
  },

  /** Envoi d'un SMS de l'échéancier avant son heure, depuis la fiche. */
  envoyerSms(id, sms) {
    surPatient(id, (p) => avecEvenement(p, {
      type: 'sms_envoye', etape: sms.etape.id, titre: `SMS ${sms.cle} délivré en avance — ${sms.etape.titre}`, detail: sms.texte,
    }));
  },

  majCabinet(patch) {
    ecrire({ ...etat, cabinet: { ...etat.cabinet, ...patch } });
    if (distant) pousser(enregistrerCabinet(etat.cabinet));
  },

  reinitialiser() {
    ecrire(neuf());
  },
};

export function useDossiers() {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

export function usePatient(token) {
  const { patients } = useDossiers();
  return patients.find((p) => p.token === token) ?? null;
}

export function useCabinet() {
  return useDossiers().cabinet;
}
