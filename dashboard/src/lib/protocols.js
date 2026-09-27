/**
 * Protocoles de purge courants en France, avec leur cinétique d'ingestion.
 * `verres` / `intervalleMin` pilotent le minuteur guidé du split-dose :
 * la nausée vient quasi toujours d'une prise trop rapide.
 */
export const PROTOCOLES = {
  MOVIPREP: {
    id: 'MOVIPREP',
    nom: 'Moviprep',
    famille: 'PEG 2 L + acide ascorbique',
    volumeFraction: '1 L de solution + 0,5 L d’eau claire',
    verres: 4,
    intervalleMin: 15,
    eauClaireApres: '500 mL d’eau ou de thé léger, sans lait',
  },
  PLENVU: {
    id: 'PLENVU',
    nom: 'Plenvu',
    famille: 'PEG bas volume (1 L)',
    volumeFraction: '500 mL de solution + 500 mL d’eau claire',
    verres: 4,
    intervalleMin: 15,
    eauClaireApres: '500 mL d’eau claire sur les 30 minutes suivantes',
  },
  EZICLEN: {
    id: 'EZICLEN',
    nom: 'Eziclen',
    famille: 'Sulfates de sodium/magnésium/potassium',
    volumeFraction: '1 flacon dilué à 500 mL + 1 L d’eau claire',
    verres: 4,
    intervalleMin: 15,
    eauClaireApres: '1 L d’eau claire impérativement, sous peine de déshydratation',
  },
};

/** Anticoagulants et antiagrégants : le champ `delai` est la consigne d'arrêt usuelle. */
export const ANTICOAGULANTS = [
  { id: 'AUCUN', label: 'Aucun', classe: null, delai: null, risque: 'nul' },
  { id: 'AOD', label: 'AOD (Eliquis, Xarelto, Pradaxa)', classe: 'Anticoagulant oral direct', delai: 'arrêt à J-2, parfois J-3 si insuffisance rénale', risque: 'majeur' },
  { id: 'AVK', label: 'AVK (Previscan, Coumadine)', classe: 'Antivitamine K', delai: 'relais héparine, INR de contrôle à J-1', risque: 'majeur' },
  { id: 'ANTIAGREGANT', label: 'Antiagrégant (Plavix, Efient, Brilique)', classe: 'Antiagrégant plaquettaire', delai: 'arrêt à J-5 après avis cardiologique', risque: 'majeur' },
  { id: 'ASPIRINE', label: 'Aspirine faible dose (Kardegic 75)', classe: 'Antiagrégant', delai: 'poursuite possible, polypectomie < 10 mm autorisée', risque: 'modere' },
];

/** Les 5 échéances de l'échéancier SMS, avec leur décalage par rapport à l'heure d'induction. */
export const ETAPES = [
  { id: 'j7', cle: 'J-7', titre: 'Logistique & anticoagulants', heure: '10h00', offsetH: -168, chemin: 'j7',
    sms: 'Endova : votre coloscopie a lieu le {date}. Deux actions vitales dès aujourd’hui : récupérer votre préparation en pharmacie et vérifier l’arrêt de vos fluidifiants sanguins.' },
  { id: 'j3', cle: 'J-3', titre: 'Régime sans résidu', heure: '09h00', offsetH: -72, chemin: 'j3',
    sms: 'Endova : début du régime sans résidu aujourd’hui. Un écart peut empêcher la détection de polypes.' },
  { id: 'j1', cle: 'J-1', titre: 'Première fraction de purge', heure: '17h00', offsetH: -15, chemin: 'j1',
    sms: 'Endova : c’est l’heure de la première dose. Buvez calmement pour éviter tout rejet. Lancez le minuteur guidé.' },
  { id: 'h4', cle: 'H-4', titre: 'Seconde fraction & contrôle', heure: 'H-4', offsetH: -4, chemin: 'h4',
    sms: 'Endova : dernière ligne droite. Prenez votre deuxième dose maintenant, puis évaluez la clarté de vos selles.' },
  { id: 'h2', cle: 'H-2', titre: 'Verrou anesthésique', heure: 'H-2', offsetH: -2, chemin: 'h2',
    sms: 'Endova : ARRÊT TOTAL. Ne plus rien boire, ne plus rien manger, ne pas fumer. Confirmez votre jeûne.' },
];

/** Échelle visuelle d'évacuation, dérivée du score de Boston. */
export const ECHELLE_EVACUATION = [
  { id: 1, titre: 'Marron épais, opaque', detail: 'Matières solides encore présentes', verdict: 'Échec de préparation', ton: 'ruby', couleur: '#4A2C17', boston: '0–1 prévisionnel' },
  { id: 2, titre: 'Marron liquide, trouble', detail: 'Liquide chargé, on ne voit pas à travers', verdict: 'Insuffisant', ton: 'amber', couleur: '#8B5A2B', boston: '1–2 prévisionnel' },
  { id: 3, titre: 'Jaune translucide', detail: 'Sans particules en suspension', verdict: 'Acceptable', ton: 'emerald', couleur: '#D9A441', boston: '2–3 prévisionnel' },
  { id: 4, titre: 'Clair comme de l’eau', detail: 'Transparent, ou thé très léger', verdict: 'Préparation parfaite', ton: 'emerald', couleur: '#E8E3C9', boston: '3 prévisionnel' },
];

/** Coût moyen d'un créneau de bloc perdu (vacance de salle + acte non coté). */
export const COUT_CRENEAU = 850;
