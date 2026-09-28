/**
 * Types d'examen pris en charge par le cabinet, et l'échéancier propre à chacun.
 *
 * Une gastroscopie ne se prépare pas comme une coloscopie : pas de purge, pas de
 * régime, mais un jeûne strict et des traitements à surveiller (GLP-1, SGLT2).
 * Une rectosigmoïdoscopie se prépare par lavements, souvent sans anesthésie.
 * L'échéancier, le score, les SMS et la PWA patient dérivent tous de cette table.
 */

const JOUR = 24 * 3600 * 1000;
const HEURE = 3600 * 1000;

/** Date de l'examen décalée de `jours`, à l'heure murale `h:m`. */
function jourA(examen, jours, h, m = 0) {
  const d = new Date(examen);
  d.setDate(d.getDate() + jours);
  d.setHours(h, m, 0, 0);
  return d;
}

export const ANESTHESIES = {
  AG: { id: 'AG', label: 'Anesthésie générale', court: 'AG', jeune: true, accompagnant: true, cpa: true },
  SEDATION: { id: 'SEDATION', label: 'Sédation', court: 'Sédation', jeune: true, accompagnant: true, cpa: true },
  SANS: { id: 'SANS', label: 'Sans anesthésie', court: 'Sans AG', jeune: false, accompagnant: false, cpa: false },
};

export const SCHEMAS = {
  FRACTIONNE: {
    id: 'FRACTIONNE',
    label: 'Fractionné (veille + matin)',
    detail: 'Première fraction la veille au soir, seconde le matin : c’est le schéma qui nettoie le mieux le côlon droit.',
  },
  JOUR_MEME: {
    id: 'JOUR_MEME',
    label: 'Jour même',
    detail: 'Les deux fractions le matin de l’examen. Réservé aux examens de l’après-midi.',
  },
};

/**
 * Catalogue des étapes. `envoi` donne l'heure du SMS ; `cle` le repère affiché
 * (il bouge avec le schéma ou la préparation renforcée).
 */
export const ETAPES = {
  j7: {
    id: 'j7',
    titre: 'Logistique & traitements',
    cle: () => 'J-7',
    envoi: (p) => jourA(p.examen.date, -7, 10),
    sms: '{cabinet} : rendez-vous le {date} à {heure} pour {examen}. Dès aujourd’hui, vérifiez vos traitements et votre préparation : {lien}',
  },
  j3: {
    id: 'j3',
    titre: 'Régime sans résidu',
    cle: (p) => (p.examen.renforce ? 'J-5' : 'J-3'),
    envoi: (p) => jourA(p.examen.date, p.examen.renforce ? -5 : -3, 9),
    sms: '{cabinet} : début du régime sans résidu aujourd’hui, jusqu’à l’examen. La liste des aliments autorisés est ici : {lien}',
  },
  j2: {
    id: 'j2',
    titre: 'Contrôle des arrêts',
    cle: () => 'J-2',
    envoi: (p) => jourA(p.examen.date, -2, 10),
    sms: '{cabinet} : votre examen est dans 2 jours, le {date} à {heure}. Vérifiez vos arrêts de traitement et votre rendez-vous d’anesthésie : {lien}',
  },
  j1: {
    id: 'j1',
    titre: 'Première fraction de purge',
    cle: (p) => (p.examen.schema === 'JOUR_MEME' ? 'H-9' : 'J-1'),
    envoi: (p) =>
      p.examen.schema === 'JOUR_MEME'
        ? new Date(new Date(p.examen.date).getTime() - 9 * HEURE)
        : jourA(p.examen.date, -1, 18),
    sms: '{cabinet} : c’est l’heure de la première dose. Buvez lentement, un verre à la fois, avec le minuteur : {lien}',
  },
  h5: {
    id: 'h5',
    titre: 'Seconde fraction & contrôle',
    cle: () => 'H-5',
    envoi: (p) => new Date(new Date(p.examen.date).getTime() - 5 * HEURE),
    sms: '{cabinet} : seconde dose maintenant, à terminer avant {limite}. Puis indiquez l’aspect de vos selles : {lien}',
  },
  h2: {
    id: 'h2',
    titre: 'Verrou de jeûne',
    cle: () => 'H-2',
    envoi: (p) => new Date(new Date(p.examen.date).getTime() - 2 * HEURE),
    sms: '{cabinet} : à partir de maintenant, plus rien à boire, à manger ni à fumer. Confirmez votre jeûne : {lien}',
  },
  g1: {
    id: 'g1',
    titre: 'Consignes de jeûne',
    cle: () => 'J-1',
    envoi: (p) => jourA(p.examen.date, -1, 18),
    sms: '{cabinet} : votre examen a lieu demain à {heure}. Dernier repas léger avant {limiteSolides}, liquides clairs jusqu’à {limite} : {lien}',
  },
  r1: {
    id: 'r1',
    titre: 'Rappel & lavements',
    cle: () => 'J-1',
    envoi: (p) => jourA(p.examen.date, -1, 18),
    sms: '{cabinet} : votre examen a lieu demain à {heure}. Vérifiez que vous avez vos deux lavements : {lien}',
  },
  lav: {
    id: 'lav',
    titre: 'Lavements',
    cle: () => 'H-3',
    envoi: (p) => new Date(new Date(p.examen.date).getTime() - 3 * HEURE),
    sms: '{cabinet} : premier lavement maintenant, le second dans une heure. Indiquez le résultat : {lien}',
  },
};

/**
 * Les examens. `poids` répartit les 100 points du score entre les étapes :
 * pour une gastroscopie, c'est le jeûne qui décide de tout.
 */
export const EXAMENS = {
  COLO: {
    id: 'COLO',
    label: 'Coloscopie',
    article: 'votre coloscopie',
    purge: true,
    anesthesie: 'AG',
    etapes: ['j7', 'j3', 'j2', 'j1', 'h5', 'h2'],
    poids: { j7: 12, j3: 13, j2: 10, j1: 25, h5: 22, h2: 18 },
    indications: [
      'Dépistage — test immunologique positif',
      'Surveillance après polypectomie',
      'Antécédent familial de cancer colorectal',
      'Rectorragies',
      'Troubles du transit',
      'Anémie ferriprive',
      'Suivi de MICI',
    ],
  },
  COLO_GASTRO: {
    id: 'COLO_GASTRO',
    label: 'Coloscopie + gastroscopie',
    article: 'votre coloscopie et gastroscopie',
    purge: true,
    anesthesie: 'AG',
    etapes: ['j7', 'j3', 'j2', 'j1', 'h5', 'h2'],
    poids: { j7: 12, j3: 13, j2: 10, j1: 25, h5: 22, h2: 18 },
    indications: [
      'Anémie ferriprive',
      'Bilan de douleurs abdominales',
      'Amaigrissement inexpliqué',
      'Suivi de MICI',
    ],
  },
  GASTRO: {
    id: 'GASTRO',
    label: 'Gastroscopie',
    article: 'votre gastroscopie',
    purge: false,
    anesthesie: 'AG',
    etapes: ['j7', 'j2', 'g1', 'h2'],
    poids: { j7: 25, j2: 15, g1: 20, h2: 40 },
    indications: [
      'Épigastralgies, dyspepsie',
      'Reflux gastro-œsophagien',
      'Dysphagie',
      'Surveillance d’endobrachyœsophage',
      'Recherche d’Helicobacter pylori',
      'Anémie ferriprive',
    ],
  },
  RECTO: {
    id: 'RECTO',
    label: 'Rectosigmoïdoscopie',
    article: 'votre rectosigmoïdoscopie',
    purge: false,
    anesthesie: 'SANS',
    etapes: ['j7', 'j2', 'r1', 'lav'],
    poids: { j7: 25, j2: 10, r1: 10, lav: 55 },
    indications: ['Rectorragies', 'Surveillance de rectite', 'Contrôle d’anastomose'],
  },
};

/** Étapes réellement suivies pour ce patient. Une recto sous sédation ajoute le verrou de jeûne. */
export function etapesDe(patient) {
  const ex = EXAMENS[patient.examen.type];
  const ids = [...ex.etapes];
  if (patient.examen.type === 'RECTO' && ANESTHESIES[patient.examen.anesthesie]?.jeune) ids.push('h2');
  return ids.map((id) => ETAPES[id]);
}

/** Pondération ramenée à 100 sur les seules étapes de l'examen. */
export function poidsDe(patient) {
  const ex = EXAMENS[patient.examen.type];
  const ids = etapesDe(patient).map((e) => e.id);
  const brut = Object.fromEntries(ids.map((id) => [id, ex.poids[id] ?? 20]));
  const somme = Object.values(brut).reduce((a, b) => a + b, 0);
  const normalise = Object.fromEntries(ids.map((id) => [id, Math.round((brut[id] / somme) * 100)]));
  // L'arrondi peut laisser un point d'écart : il revient à la dernière étape.
  const ecart = 100 - Object.values(normalise).reduce((a, b) => a + b, 0);
  normalise[ids[ids.length - 1]] += ecart;
  return normalise;
}

export const joursAvant = (patient, maintenant = new Date()) =>
  Math.ceil((new Date(patient.examen.date).setHours(0, 0, 0, 0) - new Date(maintenant).setHours(0, 0, 0, 0)) / JOUR);

/** Schéma conseillé : au-delà de 13 h, les deux fractions tiennent dans la matinée. */
export const schemaConseille = (date) => (new Date(date).getHours() >= 13 ? 'JOUR_MEME' : 'FRACTIONNE');
