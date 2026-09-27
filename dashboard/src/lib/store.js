import { useSyncExternalStore } from 'react';
import { PATIENTS_SEED } from './seed.js';

/**
 * Persistance locale + diffusion inter-onglets.
 *
 * La slice verticale de démonstration n'a pas de back-end : la PWA patient et
 * le dashboard praticien tournent dans deux onglets du même navigateur et se
 * synchronisent par BroadcastChannel. L'API (`lire`, `majEtape`) est volontairement
 * étroite pour qu'un adaptateur Supabase puisse s'y substituer sans toucher l'UI.
 */
const CLE = 'endova.dossiers.v1';
// Le projet s'est appelé Enterova : sans reprise, le renommage viderait l'écran
// de tout dossier déjà saisi. On lit l'ancienne clé une fois, puis on l'efface.
const CLE_AVANT = 'enterova.dossiers.v1';
const canal = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('endova') : null;

let etat = charger();
const abonnes = new Set();

function charger() {
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) return JSON.parse(brut);
    const avant = localStorage.getItem(CLE_AVANT);
    if (avant) {
      localStorage.setItem(CLE, avant);
      localStorage.removeItem(CLE_AVANT);
      return JSON.parse(avant);
    }
  } catch {
    // Mode privé ou stockage bloqué : on repart du programme de bloc par défaut.
  }
  return { patients: PATIENTS_SEED, journal: [] };
}

function persister() {
  try {
    localStorage.setItem(CLE, JSON.stringify(etat));
  } catch {
    // Sans persistance l'état reste en mémoire : l'app fonctionne, elle oublie au reload.
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

function commit(next, entreeJournal) {
  etat = {
    patients: next,
    journal: entreeJournal ? [{ ...entreeJournal, at: new Date().toISOString() }, ...etat.journal].slice(0, 60) : etat.journal,
  };
  persister();
  diffuser();
}

export const store = {
  subscribe(fn) {
    abonnes.add(fn);
    return () => abonnes.delete(fn);
  },
  get() {
    return etat;
  },
  patientParToken(token) {
    return etat.patients.find((p) => p.token === token) ?? null;
  },
  /** Écrit une étape de l'échéancier et journalise l'événement pour le praticien. */
  majEtape(id, etapeId, valeurs, libelleJournal) {
    const next = etat.patients.map((p) =>
      p.id === id
        ? { ...p, etapes: { ...p.etapes, [etapeId]: { ...p.etapes[etapeId], ...valeurs, done: true, at: new Date().toISOString() } } }
        : p,
    );
    const patient = etat.patients.find((p) => p.id === id);
    commit(next, { patientId: id, patient: `${patient?.nom} ${patient?.prenom}`, etape: etapeId, libelle: libelleJournal });
  },
  reinitialiser() {
    // `commit` conserve le journal : la remise à zéro écrit donc l'état directement.
    etat = { patients: structuredClone(PATIENTS_SEED), journal: [] };
    persister();
    diffuser();
  },
};

export function useDossiers() {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

export function usePatient(token) {
  const { patients } = useDossiers();
  return patients.find((p) => p.token === token) ?? null;
}
