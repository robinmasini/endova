import { PROTOCOLES } from './protocols.js';

const etapesVierges = () => ({
  j7: { done: false },
  j3: { done: false },
  j1: { done: false },
  h4: { done: false },
  h2: { done: false },
});

/** Heure d'induction du jour, sur le programme de bloc. */
function induction(h, m = 0) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

/**
 * Programme d'endoscopie du jour. Les patients sont volontairement à des stades
 * différents de l'échéancier, pour que le dashboard ait du relief dès l'ouverture.
 */
export const PATIENTS_SEED = [
  {
    id: 'p1', token: 'a7f3c1', nom: 'Berthier', prenom: 'Claire', anneeNaissance: 1968,
    telephone: '+33612345678', acte: 'Coloscopie totale sous AG', ordreBloc: 1,
    heureInduction: induction(8, 30), protocole: PROTOCOLES.MOVIPREP.id,
    etapes: {
      j7: { done: true, at: null, purgeRecuperee: true, anticoagulant: 'AUCUN', anticoagulantLabel: 'Aucun', consigneArret: null },
      j3: { done: true, at: null, regimeDemarre: true, ecarts: [] },
      j1: { done: true, at: null, tolerance: 'COMPLETE', verresBus: 4 },
      h4: { done: true, at: null, evacuation: 4, tolerance: 'COMPLETE' },
      h2: { done: true, at: null, jeuneSigne: true, tabac: false, heureDernierApport: induction(6, 15) },
    },
  },
  {
    id: 'p2', token: 'b2e9d4', nom: 'Nkemba', prenom: 'Joseph', anneeNaissance: 1955,
    telephone: '+33623456789', acte: 'Coloscopie + gastroscopie sous AG', ordreBloc: 2,
    heureInduction: induction(9, 15), protocole: PROTOCOLES.PLENVU.id,
    etapes: {
      j7: { done: true, at: null, purgeRecuperee: true, anticoagulant: 'AOD', anticoagulantLabel: 'AOD (Eliquis, Xarelto, Pradaxa)', consigneArret: false },
      j3: { done: true, at: null, regimeDemarre: true, ecarts: ['Kiwi'] },
      j1: { done: true, at: null, tolerance: 'PARTIELLE', verresBus: 3 },
      h4: { done: true, at: null, evacuation: 2, tolerance: 'PARTIELLE' },
      h2: { done: false },
    },
  },
  {
    id: 'p3', token: 'c5a8f2', nom: 'Vasseur', prenom: 'Martine', anneeNaissance: 1972,
    telephone: '+33634567890', acte: 'Coloscopie de dépistage sous AG', ordreBloc: 3,
    heureInduction: induction(10, 0), protocole: PROTOCOLES.MOVIPREP.id,
    etapes: {
      j7: { done: true, at: null, purgeRecuperee: true, anticoagulant: 'ASPIRINE', anticoagulantLabel: 'Aspirine faible dose (Kardegic 75)', consigneArret: true },
      j3: { done: true, at: null, regimeDemarre: true, ecarts: [] },
      j1: { done: true, at: null, tolerance: 'VOMI', verresBus: 2 },
      h4: { done: false },
      h2: { done: false },
    },
  },
  {
    id: 'p4', token: 'd9b6e3', nom: 'Oliveira', prenom: 'Tiago', anneeNaissance: 1990,
    telephone: '+33645678901', acte: 'Coloscopie pour rectorragies', ordreBloc: 4,
    heureInduction: induction(11, 0), protocole: PROTOCOLES.EZICLEN.id,
    etapes: {
      j7: { done: true, at: null, purgeRecuperee: true, anticoagulant: 'AUCUN', anticoagulantLabel: 'Aucun', consigneArret: null },
      j3: { done: true, at: null, regimeDemarre: true, ecarts: [] },
      j1: { done: true, at: null, tolerance: 'COMPLETE', verresBus: 4 },
      h4: { done: true, at: null, evacuation: 3, tolerance: 'COMPLETE' },
      h2: { done: false },
    },
  },
  {
    // Dossier vierge : c'est le patient de démonstration, celui qu'on suit de bout en bout.
    id: 'p5', token: 'e4c7a1', nom: 'Lemoine', prenom: 'Sophie', anneeNaissance: 1981,
    telephone: '+33656789012', acte: 'Coloscopie totale sous AG', ordreBloc: 5,
    heureInduction: induction(14, 0), protocole: PROTOCOLES.MOVIPREP.id,
    etapes: etapesVierges(),
  },
];
