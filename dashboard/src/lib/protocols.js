/**
 * Préparations coliques courantes en France, avec leur cinétique d'ingestion.
 * `verres` / `intervalleMin` pilotent le minuteur guidé : la nausée vient quasi
 * toujours d'une prise trop rapide. `contreIndications` renvoie aux comorbidités
 * de terrain.js — une purge prescrite sur un terrain qui l'interdit lève une alerte.
 */
export const PROTOCOLES = {
  MOVIPREP: {
    id: 'MOVIPREP',
    nom: 'Moviprep',
    famille: 'PEG 2 L + acide ascorbique',
    volumeFraction: '1 L de solution, puis 0,5 L de liquide clair',
    verres: 4,
    intervalleMin: 15,
    eauClaireApres: '500 mL d’eau ou de thé léger, sans lait',
    contreIndications: ['G6PD', 'PCU'],
  },
  PLENVU: {
    id: 'PLENVU',
    nom: 'Plenvu',
    famille: 'PEG bas volume (1 L)',
    volumeFraction: '500 mL de solution, puis 500 mL de liquide clair',
    verres: 4,
    intervalleMin: 15,
    eauClaireApres: '500 mL d’eau claire sur les 30 minutes suivantes',
    contreIndications: ['G6PD', 'PCU'],
  },
  EZICLEN: {
    id: 'EZICLEN',
    nom: 'Eziclen',
    famille: 'Sulfates de sodium, magnésium, potassium',
    volumeFraction: '1 flacon dilué à 500 mL, puis 1 L d’eau claire',
    verres: 4,
    intervalleMin: 15,
    eauClaireApres: '1 L d’eau claire impérativement, sous peine de déshydratation',
    contreIndications: ['IR_SEVERE', 'IC_SEVERE'],
  },
  CITRAFLEET: {
    id: 'CITRAFLEET',
    nom: 'CitraFleet',
    famille: 'Picosulfate de sodium + citrate de magnésium',
    volumeFraction: '1 sachet dans 150 mL d’eau froide, puis 1,5 L de liquides clairs',
    verres: 6,
    intervalleMin: 10,
    eauClaireApres: 'Au moins 1,5 L de liquides clairs, 250 mL toutes les 10 minutes',
    contreIndications: ['IR_SEVERE', 'IC_SEVERE'],
  },
};

/** Échelle visuelle d'évacuation, dérivée du score de Boston. */
export const ECHELLE_EVACUATION = [
  { id: 1, titre: 'Marron épais, opaque', detail: 'Matières solides encore présentes', verdict: 'Échec de préparation', ton: 'ruby', couleur: '#4A2C17', boston: '0–1 prévisionnel' },
  { id: 2, titre: 'Marron liquide, trouble', detail: 'Liquide chargé, on ne voit pas à travers', verdict: 'Insuffisant', ton: 'amber', couleur: '#8B5A2B', boston: '1–2 prévisionnel' },
  { id: 3, titre: 'Jaune translucide', detail: 'Sans particules en suspension', verdict: 'Acceptable', ton: 'emerald', couleur: '#D9A441', boston: '2–3 prévisionnel' },
  { id: 4, titre: 'Clair comme de l’eau', detail: 'Transparent, ou thé très léger', verdict: 'Préparation parfaite', ton: 'emerald', couleur: '#E8E3C9', boston: '3 prévisionnel' },
];
