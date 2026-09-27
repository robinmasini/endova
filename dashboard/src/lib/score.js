import { COUT_CRENEAU } from './protocols.js';

/**
 * Index de prédictibilité de réussite du bloc — « score Endova ».
 * Pondération : achat purge 10, régime J-3 20, fraction 1 bue 25,
 * aspect des selles à H-4 25, jeûne validé à H-2 20.
 *
 * Chaque poste accorde un crédit partiel : un patient qui a vomi la moitié
 * de sa purge n'est pas au même niveau de risque qu'un patient qui n'a rien bu.
 */
export const PONDERATION = {
  j7: { poids: 10, libelle: 'Purge récupérée en pharmacie' },
  j3: { poids: 20, libelle: 'Régime sans résidu respecté' },
  j1: { poids: 25, libelle: 'Fraction 1 ingérée et tolérée' },
  h4: { poids: 25, libelle: 'Évacuation claire à H-4' },
  h2: { poids: 20, libelle: 'Jeûne et tabac validés à H-2' },
};

function creditJ7(e) {
  if (!e?.done) return 0;
  return e.purgeRecuperee ? 10 : 0;
}

function creditJ3(e) {
  if (!e?.done) return 0;
  if (!e.regimeDemarre) return 0;
  // Chaque écart alimentaire déclaré coûte 5 points sur les 20.
  return Math.max(0, 20 - (e.ecarts?.length ?? 0) * 5);
}

function creditJ1(e) {
  if (!e?.done) return 0;
  return { COMPLETE: 25, PARTIELLE: 12, VOMI: 0 }[e.tolerance] ?? 0;
}

function creditH4(e) {
  if (!e?.done) return 0;
  // Index 1 à 4 de l'échelle d'évacuation dérivée du score de Boston.
  return { 1: 0, 2: 9, 3: 19, 4: 25 }[e.evacuation] ?? 0;
}

function creditH2(e) {
  if (!e?.done) return 0;
  if (!e.jeuneSigne) return 0;
  // Le tabac retarde la vidange gastrique : jeûne signé mais cigarette = risque Mendelson.
  return e.tabac ? 8 : 20;
}

export function calculerScore(patient) {
  const s = patient.etapes;
  const detail = {
    j7: creditJ7(s.j7),
    j3: creditJ3(s.j3),
    j1: creditJ1(s.j1),
    h4: creditH4(s.h4),
    h2: creditH2(s.h2),
  };
  const total = Object.values(detail).reduce((a, b) => a + b, 0);
  // Ce qui reste atteignable : les postes non encore échus ne pénalisent pas le pronostic.
  const acquisPossible = Object.keys(PONDERATION).reduce(
    (acc, k) => acc + (s[k]?.done ? PONDERATION[k].poids : 0),
    0,
  );
  return { total, detail, acquisPossible };
}

/**
 * Classe le patient pour le bloc.
 *
 * Un score absolu bas ne veut pas dire la même chose selon le moment : un dossier
 * à 0 dont aucune étape n'est échue n'est pas « en péril », il n'a pas commencé.
 * On juge donc sur les points réellement atteignables à ce stade, et « Sécurisé »
 * reste réservé aux préparations abouties — c'est ce que valorise le ROI.
 */
export function statutRisque(patient) {
  const { total, acquisPossible } = calculerScore(patient);

  if (acquisPossible === 0) return { ton: 'neutre', label: 'Préparation non commencée', court: 'Non commencé' };
  if (alertes(patient).some((a) => a.ton === 'ruby')) {
    return { ton: 'ruby', label: `Risque de perte (${COUT_CRENEAU} €)`, court: 'En péril' };
  }
  if (total >= 80) return { ton: 'emerald', label: 'Bloc sécurisé', court: 'Sécurisé' };

  const ratio = total / acquisPossible;
  if (ratio >= 0.8) return { ton: 'emerald', label: 'Conforme à ce stade', court: 'Sur la voie' };
  if (ratio >= 0.5) return { ton: 'amber', label: 'Vigilance requise', court: 'Vigilance' };
  return { ton: 'ruby', label: `Risque de perte (${COUT_CRENEAU} €)`, court: 'En péril' };
}

/**
 * Alertes cliniques dérivées de l'état du dossier. Recalculées à chaque lecture
 * plutôt que stockées : l'état du patient reste la seule source de vérité.
 */
export function alertes(patient) {
  const out = [];
  const s = patient.etapes;

  if (s.j7?.done && s.j7.anticoagulant !== 'AUCUN' && s.j7.consigneArret === false) {
    out.push({
      code: 'ANTICOAG_SANS_CONSIGNE',
      ton: 'ruby',
      titre: 'Anticoagulant sans consigne d’arrêt',
      detail: `Patient sous ${s.j7.anticoagulantLabel}. Aucune consigne d’arrêt reçue : toute polypectomie est contre-indiquée en l’état.`,
      action: 'Rappeler le patient et tracer la consigne avant J-2',
    });
  }
  if (s.j7?.done && !s.j7.purgeRecuperee) {
    out.push({
      code: 'PURGE_ABSENTE',
      ton: 'amber',
      titre: 'Préparation non récupérée',
      detail: 'Le patient n’a pas la purge en sa possession.',
      action: 'Vérifier la délivrance en pharmacie',
    });
  }
  if (s.j3?.done && s.j3.ecarts?.length) {
    out.push({
      code: 'ECART_REGIME',
      ton: 'amber',
      titre: `${s.j3.ecarts.length} écart(s) au régime sans résidu`,
      detail: s.j3.ecarts.join(', '),
      action: 'Renforcer la consigne, envisager un lavement de secours',
    });
  }
  if (s.j1?.done && s.j1.tolerance === 'VOMI') {
    out.push({
      code: 'VOMISSEMENT_PURGE',
      ton: 'ruby',
      titre: 'Rejet de la fraction 1',
      detail: 'Le patient a vomi une part significative de la purge. Volume ingéré insuffisant.',
      action: 'Protocole de compensation + antiémétique, réévaluer à H-4',
    });
  }
  if (s.h4?.done && s.h4.evacuation <= 2) {
    out.push({
      code: 'EVACUATION_INSUFFISANTE',
      ton: 'ruby',
      titre: 'Évacuation non conforme à H-4',
      detail: 'Selles encore chargées. Adenoma miss rate multiplié par 3 en l’état.',
      action: 'Lavement Normacol à l’arrivée, ou décaler en fin de programme',
    });
  }
  if (s.h2?.done && s.h2.tabac) {
    out.push({
      code: 'TABAC_H2',
      ton: 'ruby',
      titre: 'Tabagisme dans les 2 heures',
      detail: 'Sécrétion acide et vidange gastrique retardée : risque de syndrome de Mendelson sous propofol.',
      action: 'Signaler au MAR avant induction',
    });
  }
  if (s.h2?.done && !s.h2.jeuneSigne) {
    out.push({
      code: 'JEUNE_NON_SIGNE',
      ton: 'ruby',
      titre: 'Jeûne non certifié',
      detail: 'Le patient n’a pas signé l’engagement de jeûne.',
      action: 'Contrôle verbal obligatoire à l’accueil',
    });
  }
  return out;
}
