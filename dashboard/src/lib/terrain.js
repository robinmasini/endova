/**
 * Terrain du patient : traitements qui changent la conduite à tenir, facteurs
 * connus de préparation insuffisante, comorbidités qui contre-indiquent une purge.
 *
 * Les consignes sont les consignes usuelles (ESGE, SFED, SFAR). Elles restent
 * à valider par le prescripteur pour chaque patient : Endova les rappelle, il
 * ne les décide pas.
 */
export const TRAITEMENTS = [
  {
    id: 'AOD',
    label: 'Anticoagulant oral direct',
    exemples: 'Eliquis, Xarelto, Lixiana, Pradaxa',
    consigne: 'Arrêt 48 h avant si une polypectomie est envisagée, davantage pour Pradaxa si la fonction rénale est altérée. Pas de relais.',
    question: 'Avez-vous reçu une consigne écrite d’arrêt ?',
    critique: true,
  },
  {
    id: 'AVK',
    label: 'Antivitamine K',
    exemples: 'Previscan, Coumadine, Sintrom',
    consigne: 'Arrêt 5 jours avant, INR de contrôle la veille ; relais par héparine si le risque thrombotique est élevé.',
    question: 'Avez-vous reçu une consigne écrite d’arrêt et une ordonnance d’INR ?',
    critique: true,
  },
  {
    id: 'P2Y12',
    label: 'Antiagrégant P2Y12',
    exemples: 'Plavix, Efient, Brilique',
    consigne: 'Arrêt 5 jours avant (7 pour Efient), uniquement après avis du cardiologue. L’aspirine est maintenue.',
    question: 'Votre cardiologue vous a-t-il donné une consigne d’arrêt ?',
    critique: true,
  },
  {
    id: 'ASPIRINE',
    label: 'Aspirine faible dose',
    exemples: 'Kardégic, Aspirine Protect',
    consigne: 'Poursuite du traitement.',
    question: null,
    critique: false,
  },
  {
    id: 'GLP1',
    label: 'Agoniste du GLP-1',
    exemples: 'Ozempic, Wegovy, Trulicity, Victoza, Mounjaro',
    consigne: 'Vidange gastrique ralentie : liquides clairs la veille, anesthésiste prévenu. Suspension de l’injection hebdomadaire selon son avis.',
    question: 'Avez-vous reçu une consigne pour votre injection ?',
    critique: true,
    anesthesie: true,
  },
  {
    id: 'SGLT2',
    label: 'Gliflozine (iSGLT2)',
    exemples: 'Jardiance, Forxiga, Invokana',
    consigne: 'Arrêt 3 jours avant : le jeûne et la purge exposent à une acidocétose.',
    question: 'Avez-vous arrêté ce traitement 3 jours avant l’examen ?',
    critique: true,
  },
  {
    id: 'INSULINE',
    label: 'Insuline ou sulfamide',
    exemples: 'Insulines, Diamicron, Amarel',
    consigne: 'Doses adaptées la veille et le matin de l’examen : risque d’hypoglycémie pendant la purge et le jeûne.',
    question: 'Savez-vous comment adapter vos doses ?',
    critique: true,
  },
  {
    id: 'FER',
    label: 'Fer oral',
    exemples: 'Tardyferon, Timoferol, Fumafer',
    consigne: 'Arrêt 7 jours avant : il colle à la muqueuse et noircit les selles.',
    question: 'Avez-vous arrêté votre fer ?',
    critique: false,
  },
];

export const traitement = (id) => TRAITEMENTS.find((t) => t.id === id);

/** Facteurs reconnus de préparation colique insuffisante. */
export const FACTEURS = [
  { id: 'CONSTIPATION', label: 'Constipation chronique' },
  { id: 'PREP_ECHEC', label: 'Préparation insuffisante lors d’un examen antérieur' },
  { id: 'DIABETE', label: 'Diabète' },
  { id: 'PSYCHOTROPES', label: 'Opioïdes ou antidépresseurs tricycliques' },
  { id: 'PARKINSON', label: 'Maladie de Parkinson, AVC' },
  { id: 'CIRRHOSE', label: 'Cirrhose' },
  { id: 'OBESITE', label: 'IMC supérieur à 30' },
  { id: 'CHIR_ABDO', label: 'Chirurgie abdomino-pelvienne antérieure' },
];

export const facteur = (id) => FACTEURS.find((f) => f.id === id);

/** Comorbidités qui contre-indiquent certaines purges (voir protocols.js). */
export const COMORBIDITES = [
  { id: 'IR_SEVERE', label: 'Insuffisance rénale sévère (DFG < 30)' },
  { id: 'IC_SEVERE', label: 'Insuffisance cardiaque sévère' },
  { id: 'G6PD', label: 'Déficit en G6PD' },
  { id: 'PCU', label: 'Phénylcétonurie' },
];

export const comorbidite = (id) => COMORBIDITES.find((c) => c.id === id);

/** Au-delà de 65 ans, l'âge compte comme un facteur à part entière. */
export function facteursDe(patient, age) {
  const liste = (patient.terrain?.facteurs ?? []).map(facteur).filter(Boolean);
  if (age > 65) liste.push({ id: 'AGE', label: 'Âge supérieur à 65 ans' });
  return liste;
}

/** Préparation renforcée conseillée : un facteur déclaré suffit. */
export const renforceConseille = (patient, age) =>
  (patient.terrain?.facteurs ?? []).length > 0 || (age > 65 && (patient.terrain?.traitements ?? []).length > 0);
