import { ETAPES } from './examens.js';

/**
 * Jeu de démonstration : un cabinet libéral de deux gastro-entérologues qui
 * opèrent sur deux plateaux techniques. Les patients sont répartis sur les huit
 * prochains jours, chacun à l'étape que sa date d'examen implique : un patient
 * à J-7 n'a encore reçu que le premier SMS.
 *
 * Numéros de téléphone pris dans les plages que l'ARCEP réserve à la fiction.
 */
export const CABINET_SEED = {
  nom: 'Cabinet de gastro-entérologie des Tilleuls',
  nomCourt: 'Cabinet des Tilleuls',
  expediteur: 'TILLEULS-GE',
  telephone: '04 65 71 20 40',
  praticiens: ['Dr Hélène Marchal', 'Dr Karim Benali'],
  lieux: ['Clinique du Parc — plateau d’endoscopie', 'Centre d’endoscopie Saint-Just'],
  utilisateur: 'Nadia · secrétariat',
  valeurCreneau: 320,
};

const MIN = 60 * 1000;
const HEURE = 60 * MIN;
const [PARC, SAINT_JUST] = CABINET_SEED.lieux;
const [MARCHAL, BENALI] = CABINET_SEED.praticiens;

/** Jour J + `jours`, à `h:m`. */
function le(jours, h, m = 0) {
  const d = new Date();
  d.setDate(d.getDate() + jours);
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * La vacation du jour se cale sur l'heure de consultation de la démo : à 10 h
 * comme à 15 h, on voit un patient prêt, un patient entre deux fractions, un
 * patient en difficulté. Hors des heures de vacation, elle revient à 8 h.
 */
function vacationDuJour(decalageMin) {
  const d = new Date();
  const h = d.getHours();
  if (h < 6 || h > 15) d.setHours(8, 0, 0, 0);
  else d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  return new Date(d.getTime() + decalageMin * MIN);
}

const vierge = {
  cpa: { faite: false, date: null },
  consentement: false,
  ordonnance: true,
  bonAdmission: false,
};

function dossier({ id, token, numero, identite, examen, terrain = {}, administratif = {}, etapes = {}, evenements = [], alertesTraitees = {} }) {
  return {
    id,
    token,
    numero,
    identite: { sexe: 'F', email: '', medecinTraitant: '', ...identite },
    examen: { anesthesie: 'AG', schema: 'FRACTIONNE', renforce: false, protocole: null, ...examen, date: examen.date.toISOString() },
    terrain: { traitements: [], facteurs: [], comorbidites: [], allergies: '', antecedents: '', ...terrain },
    administratif: { ...vierge, ...administratif },
    etapes,
    evenements,
    alertesTraitees,
  };
}

/**
 * Horodate les étapes déclarées (quelques dizaines de minutes après leur SMS),
 * ajoute l'ouverture du lien correspondante, et écarte tout ce qui serait
 * postérieur à l'instant présent.
 */
function horodater(p) {
  const n = Date.now();
  const etapes = {};
  const ouvertures = [];
  for (const [id, valeurs] of Object.entries(p.etapes)) {
    const envoi = ETAPES[id].envoi(p).getTime();
    const at = Math.min(envoi + 35 * MIN, n - 3 * MIN);
    etapes[id] = { ...valeurs, done: true, at: new Date(at).toISOString() };
    ouvertures.push({ at: new Date(Math.min(envoi + 12 * MIN, at - MIN)).toISOString(), type: 'lien_ouvert' });
  }
  const evenements = [...p.evenements, ...ouvertures]
    .filter((e) => new Date(e.at).getTime() <= n)
    .sort((a, b) => new Date(a.at) - new Date(b.at));
  return { ...p, etapes, evenements };
}

const cree = (date, praticien) => ({
  at: new Date(new Date(date).getTime() - 24 * 24 * HEURE).toISOString(),
  type: 'dossier_cree',
  auteur: praticien,
  detail: 'Indication posée en consultation, échéancier SMS programmé',
});

const coche = (date, joursAvant, titre, auteur = CABINET_SEED.utilisateur) => ({
  at: new Date(new Date(date).getTime() - joursAvant * 24 * HEURE).toISOString(),
  type: 'checklist',
  titre,
  auteur,
});

const complet = { cpa: { faite: true, date: null }, consentement: true, ordonnance: true, bonAdmission: true };

export function semer() {
  const d1 = vacationDuJour(60);
  const d2 = vacationDuJour(135);
  const d3 = vacationDuJour(180);
  const d4 = vacationDuJour(240);

  const bruts = [
    // — Vacation du jour, Clinique du Parc, Dr Marchal.
    dossier({
      id: 'p1', token: 'a7f3c1', numero: 'GE-2026-0381',
      identite: { nom: 'Berthier', prenom: 'Claire', naissance: '1968-04-12', telephone: '+33639981201', medecinTraitant: 'Dr Faure' },
      examen: { type: 'COLO', indication: 'Dépistage — test immunologique positif', date: d1, lieu: PARC, operateur: MARCHAL, protocole: 'MOVIPREP' },
      administratif: { ...complet, cpa: { faite: true, date: le(-12, 10).toISOString() } },
      etapes: {
        j7: { purgeRecuperee: true, traitements: {}, accompagnant: true },
        j3: { regimeDemarre: true, ecarts: [] },
        j1: { tolerance: 'COMPLETE', verresBus: 4 },
        h5: { tolerance: 'COMPLETE', evacuation: 4 },
        h2: { jeuneSigne: true, tabac: false },
      },
      evenements: [cree(d1, MARCHAL), coche(d1, 12, 'Consultation d’anesthésie faite')],
    }),
    dossier({
      id: 'p2', token: 'b2e9d4', numero: 'GE-2026-0384',
      identite: { nom: 'Nkemba', prenom: 'Joseph', sexe: 'M', naissance: '1955-09-02', telephone: '+33639981202', medecinTraitant: 'Dr Lambert' },
      examen: { type: 'COLO_GASTRO', indication: 'Anémie ferriprive', date: d2, lieu: PARC, operateur: MARCHAL, protocole: 'PLENVU', renforce: true },
      terrain: { traitements: ['AOD', 'FER', 'INSULINE'], facteurs: ['DIABETE'], allergies: 'Pénicilline', antecedents: 'Fibrillation atriale, diabète de type 2' },
      administratif: { ...complet, cpa: { faite: true, date: le(-9, 14).toISOString() } },
      etapes: {
        j7: { purgeRecuperee: true, traitements: { AOD: true, FER: true, INSULINE: true }, accompagnant: true },
        j3: { regimeDemarre: true, ecarts: [] },
        j1: { tolerance: 'PARTIELLE', verresBus: 3 },
        h5: { tolerance: 'PARTIELLE', evacuation: 2 },
      },
      evenements: [
        cree(d2, MARCHAL),
        coche(d2, 9, 'Consultation d’anesthésie faite'),
        {
          at: new Date(d2.getTime() - 6.8 * 24 * HEURE).toISOString(), type: 'appel',
          titre: 'Appel sortant — joint', detail: 'Consigne d’arrêt d’Eliquis confirmée par le cardiologue : dernière prise 48 h avant l’examen. Envoyée par écrit.',
        },
      ],
    }),
    dossier({
      id: 'p3', token: 'c5a8f2', numero: 'GE-2026-0386',
      identite: { nom: 'Vasseur', prenom: 'Martine', naissance: '1972-01-23', telephone: '+33639981203', medecinTraitant: 'Dr Faure' },
      examen: { type: 'COLO', indication: 'Surveillance après polypectomie', date: d3, lieu: PARC, operateur: MARCHAL, protocole: 'MOVIPREP' },
      terrain: { traitements: ['ASPIRINE'] },
      administratif: { ...complet, cpa: { faite: true, date: le(-15, 9).toISOString() } },
      etapes: {
        j7: { purgeRecuperee: true, traitements: {}, accompagnant: true },
        j3: { regimeDemarre: true, ecarts: [] },
        j1: { tolerance: 'VOMI', verresBus: 2 },
      },
      evenements: [cree(d3, MARCHAL)],
    }),
    dossier({
      id: 'p4', token: 'd9b6e3', numero: 'GE-2026-0389',
      identite: { nom: 'Oliveira', prenom: 'Tiago', sexe: 'M', naissance: '1990-06-30', telephone: '+33639981204', medecinTraitant: 'Dr Morel' },
      examen: { type: 'COLO', indication: 'Rectorragies', date: d4, lieu: PARC, operateur: MARCHAL, protocole: 'EZICLEN' },
      administratif: { ...complet, cpa: { faite: true, date: le(-8, 11).toISOString() } },
      etapes: {
        j7: { purgeRecuperee: true, traitements: {}, accompagnant: true },
        j3: { regimeDemarre: true, ecarts: [] },
        j1: { tolerance: 'COMPLETE', verresBus: 4 },
        h5: { tolerance: 'COMPLETE', evacuation: 3 },
      },
      evenements: [cree(d4, MARCHAL)],
    }),

    // — Demain, Centre Saint-Just, Dr Benali.
    dossier({
      id: 'p6', token: 'f1d2c8', numero: 'GE-2026-0392',
      identite: { nom: 'Garnier', prenom: 'Henri', sexe: 'M', naissance: '1949-11-17', telephone: '+33639981206', medecinTraitant: 'Dr Roche' },
      examen: { type: 'GASTRO', indication: 'Épigastralgies, dyspepsie', date: le(1, 8, 45), lieu: SAINT_JUST, operateur: BENALI },
      terrain: { traitements: ['GLP1', 'SGLT2'], facteurs: ['DIABETE', 'OBESITE'], antecedents: 'Diabète de type 2, obésité' },
      administratif: { ...complet, cpa: { faite: true, date: le(-6, 16).toISOString() } },
      etapes: { j7: { traitements: { GLP1: true, SGLT2: false }, accompagnant: true } },
      evenements: [cree(le(1, 8, 45), BENALI), coche(le(1, 8, 45), 6, 'Consultation d’anesthésie faite')],
    }),
    dossier({
      id: 'p7', token: 'a3b7e9', numero: 'GE-2026-0393',
      identite: { nom: 'Roussel', prenom: 'Amandine', naissance: '1987-03-08', telephone: '+33639981207', medecinTraitant: 'Dr Morel' },
      examen: { type: 'COLO', indication: 'Troubles du transit', date: le(1, 14, 30), lieu: SAINT_JUST, operateur: BENALI, protocole: 'CITRAFLEET', schema: 'JOUR_MEME' },
      administratif: { ...complet, cpa: { faite: true, date: le(-10, 10).toISOString() } },
      etapes: {
        j7: { purgeRecuperee: true, traitements: {}, accompagnant: true },
        j3: { regimeDemarre: true, ecarts: ['Kiwi', 'Pain complet, aux céréales'] },
      },
      evenements: [cree(le(1, 14, 30), BENALI)],
    }),

    // — Dans trois jours.
    dossier({
      id: 'p8', token: 'b8c4d1', numero: 'GE-2026-0395',
      identite: { nom: 'Da Silva', prenom: 'Marc', sexe: 'M', naissance: '1963-12-04', telephone: '+33639981208', medecinTraitant: 'Dr Lambert' },
      examen: { type: 'COLO_GASTRO', indication: 'Bilan de douleurs abdominales', date: le(3, 9, 30), lieu: PARC, operateur: MARCHAL, protocole: 'MOVIPREP', renforce: true },
      terrain: { traitements: [], facteurs: ['CONSTIPATION', 'PSYCHOTROPES'], antecedents: 'Lombalgie chronique sous tramadol' },
      administratif: { consentement: true, ordonnance: true, bonAdmission: true },
      etapes: {
        j7: { purgeRecuperee: true, traitements: {}, accompagnant: true },
        j3: { regimeDemarre: true, ecarts: [] },
      },
      evenements: [cree(le(3, 9, 30), MARCHAL)],
    }),
    dossier({
      id: 'p9', token: 'c2e6f4', numero: 'GE-2026-0396',
      identite: { nom: 'Fabre', prenom: 'Lucie', naissance: '1979-07-19', telephone: '+33639981209', medecinTraitant: 'Dr Roche' },
      examen: { type: 'RECTO', indication: 'Rectorragies', date: le(3, 11), lieu: SAINT_JUST, operateur: BENALI, anesthesie: 'SANS' },
      administratif: { consentement: true, ordonnance: true },
      etapes: { j7: { traitements: {} } },
      evenements: [cree(le(3, 11), BENALI)],
    }),

    // — Dans cinq jours : le premier SMS est parti il y a deux jours, jamais ouvert.
    dossier({
      id: 'p10', token: 'd4f8a2', numero: 'GE-2026-0398',
      identite: { nom: 'Petit', prenom: 'Bernard', sexe: 'M', naissance: '1958-02-26', telephone: '+33639981210', medecinTraitant: 'Dr Faure' },
      examen: { type: 'COLO', indication: 'Antécédent familial de cancer colorectal', date: le(5, 8), lieu: PARC, operateur: MARCHAL, protocole: 'PLENVU' },
      terrain: { traitements: ['AVK'], antecedents: 'Valve mécanique aortique' },
      administratif: { cpa: { faite: true, date: le(-4, 15).toISOString() }, ordonnance: true },
      evenements: [cree(le(5, 8), MARCHAL)],
    }),

    // — Dans sept jours : le dossier de démonstration, vierge, suivi de bout en bout.
    dossier({
      id: 'p5', token: 'e4c7a1', numero: 'GE-2026-0401',
      identite: { nom: 'Lemoine', prenom: 'Sophie', naissance: '1981-05-14', telephone: '+33639981205', email: 'sophie.lemoine@exemple.fr', medecinTraitant: 'Dr Morel' },
      examen: { type: 'COLO', indication: 'Troubles du transit', date: le(7, 10), lieu: PARC, operateur: MARCHAL, protocole: 'MOVIPREP' },
      terrain: { traitements: ['FER'] },
      administratif: { ordonnance: true },
      evenements: [cree(le(7, 10), MARCHAL)],
    }),
  ];

  return bruts.map(horodater);
}
