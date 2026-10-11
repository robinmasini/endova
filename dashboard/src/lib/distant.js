import { supabase } from './supabase.js';

/**
 * Le côté serveur du store.
 *
 * Il ne connaît que la traduction entre la forme que manipule l'application et
 * les lignes de la base. Toute la logique métier reste dans `store.js`, qui
 * continue de travailler en mémoire : c'est ce qui permet à l'interface de
 * rester synchrone, et de revenir au stockage navigateur sans rien réécrire.
 */

/** Ligne → dossier, tel que l'application l'attend. */
function versDossier(ligne, evenements = []) {
  return {
    id: ligne.id,
    token: ligne.jeton,
    numero: ligne.numero,
    identite: ligne.identite ?? {},
    examen: { ...(ligne.examen ?? {}), date: ligne.examen_date, type: ligne.examen_type },
    terrain: ligne.terrain ?? {},
    administratif: ligne.administratif ?? {},
    etapes: ligne.etapes ?? {},
    alertesTraitees: ligne.alertes_traitees ?? {},
    evenements,
  };
}

/** Dossier → ligne. La date et le type d'examen sortent du jsonb : on filtre dessus. */
function versLigne(p, cabinetId) {
  const { date, type, ...reste } = p.examen ?? {};
  return {
    id: p.id,
    cabinet_id: cabinetId,
    numero: p.numero,
    jeton: p.token,
    examen_date: date,
    examen_type: type,
    identite: p.identite ?? {},
    examen: reste,
    terrain: p.terrain ?? {},
    administratif: p.administratif ?? {},
    etapes: p.etapes ?? {},
    alertes_traitees: p.alertesTraitees ?? {},
  };
}

function versCabinet(ligne) {
  return {
    id: ligne.id,
    nom: ligne.nom,
    nomCourt: ligne.nom_court,
    expediteur: ligne.expediteur,
    telephone: ligne.telephone,
    praticiens: ligne.praticiens ?? [],
    lieux: ligne.lieux ?? [],
    valeurCreneau: ligne.valeur_creneau,
    delaiResultats: ligne.delai_resultats,
    utilisateur: ligne.utilisateur ?? '',
  };
}

/**
 * Tout l'état du cabinet connecté.
 *
 * Renvoie `null` quand l'utilisateur n'est rattaché à aucun cabinet : c'est le
 * cas d'un compte tout juste créé, et l'application doit le dire plutôt que
 * d'afficher un tableau vide qu'on prendrait pour une panne.
 */
export async function chargerEtat() {
  const { data: cabinets, error: eCab } = await supabase.from('cabinets').select('*').limit(1);
  if (eCab) throw new Error(`Lecture du cabinet : ${eCab.message}`);
  if (!cabinets?.length) return null;

  const cabinet = versCabinet(cabinets[0]);

  const { data: lignes, error: eDos } = await supabase
    .from('dossiers').select('*').order('examen_date', { ascending: true });
  if (eDos) throw new Error(`Lecture des dossiers : ${eDos.message}`);

  const ids = (lignes ?? []).map((l) => l.id);
  let journaux = new Map();
  if (ids.length) {
    const { data: evts, error: eEvt } = await supabase
      .from('evenements').select('*').in('dossier_id', ids).order('survenu_le', { ascending: true });
    if (eEvt) throw new Error(`Lecture du journal : ${eEvt.message}`);
    journaux = (evts ?? []).reduce((m, e) => {
      const liste = m.get(e.dossier_id) ?? [];
      liste.push({ at: e.survenu_le, type: e.type, auteur: e.auteur, etape: e.etape ?? undefined, ...(e.detail ?? {}) });
      m.set(e.dossier_id, liste);
      return m;
    }, new Map());
  }

  return {
    cabinet,
    patients: (lignes ?? []).map((l) => versDossier(l, journaux.get(l.id) ?? [])),
  };
}

/** Écrit le dossier en entier. Le journal part à part : il ne se réécrit pas. */
export async function enregistrerDossier(patient, cabinetId) {
  const { error } = await supabase.from('dossiers').upsert(versLigne(patient, cabinetId));
  if (error) throw new Error(`Enregistrement du dossier : ${error.message}`);
}

export async function ajouterEvenements(dossierId, evenements) {
  if (!evenements.length) return;
  const lignes = evenements.map(({ at, type, auteur, etape, ...detail }) => ({
    dossier_id: dossierId, type, auteur: auteur ?? '', etape: etape ?? null,
    detail, survenu_le: at,
  }));
  const { error } = await supabase.from('evenements').insert(lignes);
  if (error) throw new Error(`Journal : ${error.message}`);
}

export async function enregistrerCabinet(cabinet) {
  const { error } = await supabase.from('cabinets').update({
    nom: cabinet.nom,
    nom_court: cabinet.nomCourt,
    expediteur: cabinet.expediteur,
    telephone: cabinet.telephone,
    praticiens: cabinet.praticiens,
    lieux: cabinet.lieux,
    valeur_creneau: cabinet.valeurCreneau,
    delai_resultats: cabinet.delaiResultats ?? 'quinze jours',
  }).eq('id', cabinet.id);
  if (error) throw new Error(`Enregistrement du cabinet : ${error.message}`);
}

/** Crée le cabinet et rattache l'utilisateur courant. Appelé une seule fois. */
export async function installerCabinet({ nom, nomCourt, expediteur }) {
  const { error } = await supabase.rpc('installer_cabinet', {
    p_nom: nom, p_nom_court: nomCourt, p_expediteur: expediteur,
  });
  if (error) throw new Error(`Installation du cabinet : ${error.message}`);
}
