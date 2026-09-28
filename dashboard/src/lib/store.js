import { useSyncExternalStore } from 'react';
import { semer, CABINET_SEED } from './seed.js';

/**
 * Persistance locale + diffusion inter-onglets.
 *
 * La démonstration n'a pas de back-end : la PWA patient et le logiciel du cabinet
 * tournent dans deux onglets du même navigateur et se synchronisent par
 * BroadcastChannel. L'API reste volontairement étroite pour qu'un adaptateur
 * serveur puisse s'y substituer sans toucher l'interface.
 */
// v2 : dossier structuré (identité, examen, terrain, administratif, journal).
// Les données v1 ne se convertissent pas proprement : on repart du jeu de démo.
const CLE = 'endova.dossiers.v2';
const canal = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('endova') : null;

let etat = charger();
const abonnes = new Set();

function neuf() {
  return { patients: semer(), cabinet: structuredClone(CABINET_SEED) };
}

function charger() {
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) return JSON.parse(brut);
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

function ecrire(next) {
  etat = next;
  persister();
  diffuser();
}

const maintenant = () => new Date().toISOString();

/** Applique `fn` au seul dossier `id`. */
function surPatient(id, fn) {
  ecrire({ ...etat, patients: etat.patients.map((p) => (p.id === id ? fn(p) : p)) });
}

const avecEvenement = (p, evt) => ({
  ...p,
  evenements: [...(p.evenements ?? []), { at: maintenant(), auteur: evt.auteur ?? etat.cabinet.utilisateur, ...evt }],
});

const jeton = () => Math.random().toString(16).slice(2, 8);

export const store = {
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
    const id = `p${Date.now().toString(36)}`;
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

  majCabinet(patch) {
    ecrire({ ...etat, cabinet: { ...etat.cabinet, ...patch } });
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
