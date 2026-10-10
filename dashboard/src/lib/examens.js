/**
 * Types d'examen pris en charge par le cabinet, et l'échéancier propre à chacun.
 *
 * RÈGLE : Endova est un outil préopératoire. L'échéancier court de J-28 au plus
 * tôt jusqu'au jour J, et s'arrête là. Aucune étape ne porte de repère au-delà :
 * ce qui suit l'examen appartient à l'équipe d'endoscopie, pas à cet outil.
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
    pourquoi: 'Sept jours, c’est ce qu’il faut pour arrêter le fer et les antiagrégants, retirer l’ordonnance de purge et trouver un accompagnant. Passé J-5, ces décisions ne se rattrapent plus.',
    titre: 'Logistique & traitements',
    cle: () => 'J-7',
    envoi: (p) => jourA(p.examen.date, -7, 10),
    sms: '{cabinet} : rendez-vous le {date} à {heure} pour {examen}. Dès aujourd’hui, vérifiez vos traitements et votre préparation : {lien}',
  },
  j3: {
    id: 'j3',
    pourquoi: 'L’ESGE demande au moins la veille sans résidu. Le cabinet étend à trois jours, cinq si la préparation est renforcée : constipation, échec antérieur, opiacés.',
    titre: 'Régime sans résidu',
    cle: (p) => (p.examen.renforce ? 'J-5' : 'J-3'),
    envoi: (p) => jourA(p.examen.date, p.examen.renforce ? -5 : -3, 9),
    sms: '{cabinet} : début du régime sans résidu aujourd’hui, jusqu’à l’examen. La liste des aliments autorisés est ici : {lien}',
  },
  j2: {
    id: 'j2',
    pourquoi: 'Dernier moment utile : la consultation d’anesthésie doit avoir eu lieu au moins 48 h avant, et un arrêt de traitement oublié se rattrape encore.',
    titre: 'Contrôle des arrêts',
    cle: () => 'J-2',
    envoi: (p) => jourA(p.examen.date, -2, 10),
    sms: '{cabinet} : votre examen est dans 2 jours, le {date} à {heure}. Vérifiez vos arrêts de traitement et votre rendez-vous d’anesthésie : {lien}',
  },
  j1: {
    id: 'j1',
    pourquoi: 'La dose fractionnée nettoie mieux que la dose unique, en particulier le côlon droit. C’est le point le mieux établi de toute la préparation colique.',
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
    pourquoi: 'Le contrôle de l’effluent tombe ici parce qu’il reste du temps : à H-5, un lavement de secours ou un décalage en fin de vacation sont encore possibles. À H-2, il n’y a plus de recours.',
    titre: 'Seconde fraction & contrôle',
    cle: () => 'H-5',
    envoi: (p) => new Date(new Date(p.examen.date).getTime() - 5 * HEURE),
    sms: '{cabinet} : seconde dose maintenant, à terminer avant {limite}. Puis indiquez l’aspect de vos selles : {lien}',
  },
  h2: {
    id: 'h2',
    pourquoi: 'Deux heures de jeûne pour les liquides clairs, conformément aux usages d’anesthésie. Le tabac compte aussi : il augmente les sécrétions gastriques.',
    titre: 'Verrou de jeûne',
    cle: () => 'H-2',
    envoi: (p) => new Date(new Date(p.examen.date).getTime() - 2 * HEURE),
    sms: '{cabinet} : à partir de maintenant, plus rien à boire, à manger ni à fumer. Confirmez votre jeûne : {lien}',
  },
  g1: {
    id: 'g1',
    pourquoi: 'Sans purge, le jeûne fait toute la préparation : six heures pour les solides, deux pour les liquides clairs.',
    titre: 'Consignes de jeûne',
    cle: () => 'J-1',
    envoi: (p) => jourA(p.examen.date, -1, 18),
    sms: '{cabinet} : votre examen a lieu demain à {heure}. Dernier repas léger avant {limiteSolides}, liquides clairs jusqu’à {limite} : {lien}',
  },
  r1: {
    id: 'r1',
    pourquoi: 'Les lavements se font le matin même. Le SMS de la veille ne sert qu’à vérifier que le patient les a entre les mains.',
    titre: 'Rappel & lavements',
    cle: () => 'J-1',
    envoi: (p) => jourA(p.examen.date, -1, 18),
    sms: '{cabinet} : votre examen a lieu demain à {heure}. Vérifiez que vous avez vos deux lavements : {lien}',
  },
  // — Fenêtres de sevrage. Certains examens ne mesurent rien si un traitement
  //   court encore : ce n'est pas une précaution, c'est la condition du résultat.
  ipp7: {
    id: 'ipp7',
    pourquoi: 'Une pH-métrie sous inhibiteur de la pompe à protons mesure le médicament, pas la maladie. Le délai admis est de sept jours ; trois pour les anti-H2, vingt-quatre heures pour les pansements.',
    titre: 'Arrêt des anti-acides',
    cle: () => 'J-7',
    envoi: (p) => jourA(p.examen.date, -7, 10),
    sms: '{cabinet} : votre examen a lieu le {date}. À partir d’aujourd’hui, arrêtez votre traitement anti-acide — sinon la mesure sera ininterprétable. Détail : {lien}',
    consigne: {
      points: [
        ['Pill', 'Arrêtez les IPP dès aujourd’hui', 'Oméprazole, ésoméprazole, pantoprazole, lansoprazole, rabéprazole — tout nom finissant par « -prazole ».'],
        ['Clock', 'Anti-H2 : trois jours avant', 'Ranitidine, famotidine, cimétidine.'],
        ['GlassWater', 'Pansements et alginates : la veille', 'Gaviscon, Maalox, Phosphalugel — autorisés jusqu’à vingt-quatre heures avant.'],
        ['AlertTriangle', 'Les brûlures vont revenir', 'C’est attendu, et c’est précisément ce que l’examen doit enregistrer. Si elles deviennent insupportables, appelez le cabinet plutôt que de reprendre le traitement.'],
      ],
      question: {
        cle: 'arretAcide',
        titre: 'Avez-vous arrêté ce traitement ?',
        oui: 'Oui, je l’ai arrêté',
        non: 'Non, je le prends encore',
        nonDetail: 'Dites-le maintenant : l’examen devra probablement être décalé.',
      },
      engagement: 'J’ai lu les délais d’arrêt et je les respecte.',
    },
  },
  ipp14: {
    id: 'ipp14',
    pourquoi: 'Un inhibiteur de la pompe à protons fait disparaître Helicobacter pylori du test sans l’éradiquer : le résultat revient négatif à tort. Le délai admis est de deux semaines.',
    titre: 'Arrêt des anti-acides',
    cle: () => 'J-14',
    envoi: (p) => jourA(p.examen.date, -14, 10),
    sms: '{cabinet} : votre test respiratoire a lieu le {date}. Arrêtez dès aujourd’hui tout traitement anti-acide, sans quoi le test serait faussement négatif. Détail : {lien}',
    consigne: {
      points: [
        ['Pill', 'Arrêtez les IPP dès aujourd’hui', 'Tout nom finissant par « -prazole ». Deux semaines sans, c’est la condition d’un test fiable.'],
        ['GlassWater', 'Pansements et alginates autorisés', 'Gaviscon, Maalox : ils ne faussent pas le test.'],
        ['AlertTriangle', 'Un test faussement négatif se paie plus tard', 'Une bactérie déclarée absente ne sera pas traitée, et continuera son travail sur la muqueuse.'],
      ],
      question: {
        cle: 'arretAcide',
        titre: 'Avez-vous arrêté ce traitement ?',
        oui: 'Oui, je l’ai arrêté',
        non: 'Non, je le prends encore',
        nonDetail: 'Le test serait ininterprétable : appelez-nous pour le décaler.',
      },
      engagement: 'J’ai compris que le test est faux si je reprends ce traitement.',
    },
  },
  atb28: {
    id: 'atb28',
    pourquoi: 'Un antibiotique ou un sel de bismuth, même pris pour autre chose, suffit à rendre le test négatif sans éradiquer la bactérie. Le délai admis est de quatre semaines.',
    titre: 'Arrêt des antibiotiques',
    cle: () => 'J-28',
    envoi: (p) => jourA(p.examen.date, -28, 10),
    sms: '{cabinet} : votre test respiratoire est prévu le {date}. Aucun antibiotique ni sel de bismuth d’ici là — même prescrit pour autre chose. Détail : {lien}',
    consigne: {
      points: [
        ['Pill', 'Aucun antibiotique pendant quatre semaines', 'Pour une angine, une cystite, une dent : prévenez-nous avant de commencer, le test sera décalé.'],
        ['Pill', 'Ni sel de bismuth', 'Pylera et apparentés.'],
        ['Info', 'Les autres traitements continuent', 'Sauf avis contraire de votre médecin, le reste de vos médicaments ne change pas.'],
      ],
      question: {
        cle: 'sansAntibiotique',
        titre: 'Un antibiotique depuis un mois ?',
        oui: 'Non, aucun',
        non: 'Oui, j’en ai pris',
        nonDetail: 'Indiquez-le : le test devra être repoussé pour rester fiable.',
      },
      engagement: 'Je préviendrai le cabinet si un antibiotique m’est prescrit d’ici l’examen.',
    },
  },
  vc1: {
    id: 'vc1',
    pourquoi: 'La capsule n’a pas de canal de lavage : ce qu’elle rencontre, elle le photographie. Une purge la veille est le seul moyen de dégager la muqueuse du grêle.',
    titre: 'Préparation de la veille',
    cle: () => 'J-1',
    envoi: (p) => jourA(p.examen.date, -1, 12),
    sms: '{cabinet} : à partir de midi, liquides clairs uniquement, puis la préparation ce soir. À jeun à partir de minuit. Le détail est ici : {lien}',
    consigne: {
      points: [
        ['Salad', 'Liquides clairs à partir de midi', 'Eau, bouillon filtré, thé ou café sans lait, jus sans pulpe. Rien de coloré en rouge ou violet.'],
        ['GlassWater', 'La préparation prescrite, ce soir', 'Buvez-la lentement, en suivant l’ordonnance remise par le cabinet.'],
        ['Clock', 'À jeun à partir de minuit', 'Plus rien, pas même de l’eau, jusqu’à l’ingestion de la capsule.'],
        ['Info', 'Après l’ingestion, au cabinet', 'Vous pourrez boire deux heures après, et prendre un repas léger quatre heures après. Gardez l’enregistreur allumé et sur vous.'],
      ],
      question: {
        cle: 'preparationPrise',
        titre: 'La préparation d’hier soir',
        oui: 'Oui, en entier',
        non: 'Non, ou seulement en partie',
        nonDetail: 'Le grêle risque d’être illisible : appelez-nous avant de venir.',
      },
      engagement: 'J’ai compris que je dois être à jeun depuis minuit.',
    },
  },

  // — Suites propres à certains gestes.
  lav: {
    id: 'lav',
    pourquoi: 'Trois heures avant : le temps de refaire un lavement si le premier ne ramène pas clair.',
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
    preparation: 'Purge colique',
    purge: true,
    fractions: true,
    projection: true,
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
    preparation: 'Purge colique',
    purge: true,
    fractions: true,
    projection: true,
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
    preparation: 'Jeûne seul',
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
    preparation: 'Lavements',
    purge: false,
    anesthesie: 'SANS',
    etapes: ['j7', 'j2', 'r1', 'lav'],
    poids: { j7: 25, j2: 10, r1: 10, lav: 55 },
    indications: ['Rectorragies', 'Surveillance de rectite', 'Contrôle d’anastomose'],
  },
  EUS: {
    id: 'EUS',
    label: 'Écho-endoscopie',
    article: 'votre écho-endoscopie',
    preparation: 'Jeûne seul',
    purge: false,
    anesthesie: 'AG',
    etapes: ['j7', 'j2', 'g1', 'h2'],
    poids: { j7: 22, j2: 20, g1: 18, h2: 40 },
    indications: [
      'Bilan d’extension d’une tumeur digestive',
      'Exploration du pancréas',
      'Lithiase de la voie biliaire principale',
      'Tumeur sous-muqueuse',
      'Ponction écho-guidée',
    ],
  },
  CPRE: {
    id: 'CPRE',
    label: 'CPRE — voies biliaires',
    article: 'votre CPRE',
    preparation: 'Jeûne seul',
    purge: false,
    anesthesie: 'AG',
    etapes: ['j7', 'j2', 'g1', 'h2'],
    // La sphinctérotomie est un geste à haut risque hémorragique : le contrôle
    // des arrêts de traitement pèse plus lourd ici que partout ailleurs.
    poids: { j7: 20, j2: 26, g1: 14, h2: 40 },
    indications: [
      'Calcul de la voie biliaire principale',
      'Sténose biliaire',
      'Pose ou changement de prothèse',
      'Angiocholite',
      'Fuite biliaire après chirurgie',
    ],
  },
  CAPSULE: {
    id: 'CAPSULE',
    label: 'Vidéocapsule du grêle',
    article: 'votre vidéocapsule',
    preparation: 'Purge du grêle',
    purge: true,
    // Une purge, mais pas le schéma fractionné de la coloscopie, et pas de
    // projection colique : la capsule explore le grêle.
    fractions: false,
    projection: false,
    anesthesie: 'SANS',
    etapes: ['j7', 'j2', 'vc1', 'h2'],
    poids: { j7: 20, j2: 15, vc1: 35, h2: 30 },
    indications: [
      'Saignement digestif inexpliqué',
      'Anémie ferriprive sans cause retrouvée',
      'Suspicion de maladie de Crohn du grêle',
      'Surveillance de polypose',
      'Maladie cœliaque compliquée',
    ],
  },
  PHMETRIE: {
    id: 'PHMETRIE',
    label: 'pH-métrie œsophagienne',
    article: 'votre pH-métrie',
    preparation: 'Sevrage anti-acide',
    purge: false,
    anesthesie: 'SANS',
    etapes: ['ipp7', 'j2', 'g1'],
    poids: { ipp7: 45, j2: 20, g1: 35 },
    indications: [
      'Reflux résistant au traitement',
      'Bilan avant chirurgie anti-reflux',
      'Douleurs thoraciques non cardiaques',
      'Toux ou laryngite chroniques',
    ],
  },
  HPYLORI: {
    id: 'HPYLORI',
    label: 'Test respiratoire — H. pylori',
    article: 'votre test respiratoire',
    preparation: 'Sevrage anti-acide',
    purge: false,
    anesthesie: 'SANS',
    etapes: ['atb28', 'ipp14', 'g1'],
    poids: { atb28: 30, ipp14: 40, g1: 30 },
    indications: [
      'Contrôle d’éradication d’Helicobacter pylori',
      'Dyspepsie non explorée',
      'Avant un traitement par AINS au long cours',
      'Antécédent familial de cancer gastrique',
    ],
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
