/**
 * Projection de l'état de préparation sur le tube digestif.
 *
 * Le score de Boston ne note pas « le côlon » mais trois segments séparément,
 * et ces segments ne se nettoient pas de la même façon :
 *  - le côlon gauche est lavé par les deux fractions, c'est toujours le mieux préparé ;
 *  - le côlon droit ne se nettoie que par la seconde fraction, c'est lui qui s'effondre
 *    quand le split-dose n'est pas respecté ou que la fraction 2 est incomplète ;
 *  - le transverse est intermédiaire.
 * D'où une dégradation orientée, et non un score uniforme plaqué sur tout le cadre colique.
 */

const DEPUIS_EVACUATION = { 1: 0, 2: 1, 3: 2, 4: 3 };

function borne(n) {
  return Math.max(0, Math.min(3, n));
}

export const TON_BOSTON = { 0: 'ruby', 1: 'ruby', 2: 'amber', 3: 'emerald' };

export const LIBELLE_BOSTON = {
  0: 'Segment non analysable',
  1: 'Résidus opaques persistants',
  2: 'Muqueuse vue, résidus mineurs',
  3: 'Muqueuse parfaitement exposée',
};

export function etatSegments(patient) {
  const { j1, j3, h5: h4, h2 } = patient.etapes;

  if (!h4?.done) {
    const attente = { boston: null, ton: 'neutre', libelle: 'Évaluation H-5 non reçue' };
    return {
      inconnu: true,
      droit: attente,
      transverse: attente,
      gauche: attente,
      grele: etatGrele(j3),
      haut: etatHaut(h2),
    };
  }

  const base = DEPUIS_EVACUATION[h4.evacuation] ?? 0;
  const fraction2Incomplete = h4.tolerance === 'PARTIELLE';
  const fraction1Rejetee = j1?.tolerance === 'VOMI';
  const fraction1Partielle = j1?.tolerance === 'PARTIELLE';

  const droit = borne(base - (fraction2Incomplete ? 1 : 0) - (fraction1Rejetee ? 1 : 0));
  const transverse = borne(base - (fraction1Rejetee ? 1 : 0));
  const gauche = borne(base - (fraction1Rejetee && fraction1Partielle ? 1 : 0));

  const habiller = (n, note) => ({ boston: n, ton: TON_BOSTON[n], libelle: LIBELLE_BOSTON[n], note });

  return {
    inconnu: false,
    droit: habiller(droit, fraction2Incomplete
      ? 'Fraction 2 incomplète : c’est le segment qui en souffre le plus'
      : 'Nettoyé par la seconde fraction'),
    transverse: habiller(transverse, fraction1Rejetee ? 'Pénalisé par le rejet de la fraction 1' : null),
    gauche: habiller(gauche, 'Lavé par les deux fractions'),
    grele: etatGrele(j3),
    haut: etatHaut(h2),
  };
}

function etatGrele(j3) {
  if (!j3?.done) return { ton: 'neutre', libelle: 'Régime non confirmé' };
  if (j3.ecarts?.length)
    return {
      ton: 'amber',
      libelle: `${j3.ecarts.length} écart(s) au régime`,
      note: `${j3.ecarts.join(', ')} — résidus possibles jusqu’au cadre colique`,
    };
  return { ton: 'emerald', libelle: 'Régime sans résidu respecté' };
}

/** Œsophage et estomac : zone du risque anesthésique, pas du risque de préparation. */
function etatHaut(h2) {
  if (!h2?.done) return { ton: 'neutre', libelle: 'Jeûne non encore certifié' };
  if (!h2.jeuneSigne) return { ton: 'ruby', libelle: 'Jeûne non certifié', note: 'Contrôle verbal obligatoire à l’accueil' };
  if (h2.tabac)
    return {
      ton: 'ruby',
      libelle: 'Tabac dans les 2 heures',
      note: 'Sécrétion acide et vidange gastrique retardée : risque de syndrome de Mendelson',
    };
  return { ton: 'emerald', libelle: 'Estomac vide, induction sécurisée' };
}
