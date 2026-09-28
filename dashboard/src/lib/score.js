import { etapesDe, poidsDe, joursAvant, ETAPES } from './examens.js';
import { traitement, comorbidite } from './terrain.js';
import { PROTOCOLES } from './protocols.js';
import { anesthesieDe, examenDe } from './patient.js';

/**
 * Index de préparation — « score Endova ».
 *
 * Chaque étape de l'échéancier vaut une part des 100 points, répartie selon
 * l'examen (voir examens.js). Chaque étape rend un crédit entre 0 et 1 : un
 * patient qui a vomi la moitié de sa purge n'est pas au même niveau de risque
 * qu'un patient qui n'a rien bu.
 */
const CREDITS = {
  j7(e, p) {
    let r = 1;
    if (examenDe(p).purge && !e.purgeRecuperee) r -= 0.4;
    const reponses = e.traitements ?? {};
    for (const [id, ok] of Object.entries(reponses)) {
      if (ok === false) r -= traitement(id)?.critique ? 0.4 : 0.15;
    }
    if (anesthesieDe(p).accompagnant && e.accompagnant === false) r -= 0.2;
    return r;
  },
  j3: (e) => (e.regimeDemarre ? 1 - (e.ecarts?.length ?? 0) * 0.25 : 0),
  j1: (e) => ({ COMPLETE: 1, PARTIELLE: 0.5, VOMI: 0 })[e.tolerance] ?? 0,
  h5: (e) => ({ 1: 0, 2: 0.35, 3: 0.75, 4: 1 })[e.evacuation] ?? 0,
  // Le tabac retarde la vidange gastrique : jeûne signé mais cigarette = risque d'inhalation.
  h2: (e) => (e.jeuneSigne ? (e.tabac ? 0.4 : 1) : 0),
  g1: (e) => (e.compris ? (e.liquidesClairs === false ? 0.5 : 1) : 0),
  r1: (e) => (e.lavementsEnMain ? 1 : 0.3),
  lav: (e) => {
    if (e.lavementsFaits >= 2) return e.resultat === 'CLAIR' ? 1 : 0.55;
    return e.lavementsFaits === 1 ? 0.35 : 0;
  },
};

export function calculerScore(patient) {
  const poids = poidsDe(patient);
  const detail = {};
  let acquisPossible = 0;
  for (const etape of etapesDe(patient)) {
    const e = patient.etapes[etape.id];
    const credit = e?.done ? Math.max(0, Math.min(1, CREDITS[etape.id](e, patient))) : 0;
    detail[etape.id] = Math.round(credit * poids[etape.id]);
    if (e?.done) acquisPossible += poids[etape.id];
  }
  const total = Object.values(detail).reduce((a, b) => a + b, 0);
  return { total, detail, acquisPossible, poids };
}

/**
 * Classe le dossier.
 *
 * Un score absolu bas ne veut pas dire la même chose selon le moment : un dossier
 * à 0 dont aucune étape n'est échue n'est pas « en péril », il n'a pas commencé.
 * On juge donc sur les points réellement atteignables à ce stade.
 */
export function statutRisque(patient) {
  const { total, acquisPossible } = calculerScore(patient);
  const actives = alertesActives(patient);

  if (actives.some((a) => a.ton === 'ruby')) return { ton: 'ruby', label: 'Examen compromis en l’état', court: 'En péril' };
  if (acquisPossible === 0) {
    return actives.length
      ? { ton: 'amber', label: 'Vigilance requise', court: 'Vigilance' }
      : { ton: 'neutre', label: 'Préparation non commencée', court: 'À venir' };
  }
  if (total >= 80) return { ton: 'emerald', label: 'Préparation aboutie', court: 'Prêt' };

  const ratio = total / acquisPossible;
  if (ratio >= 0.8 && !actives.length) return { ton: 'emerald', label: 'Conforme à ce stade', court: 'Sur la voie' };
  if (ratio >= 0.5) return { ton: 'amber', label: 'Vigilance requise', court: 'Vigilance' };
  return { ton: 'ruby', label: 'Examen compromis en l’état', court: 'En péril' };
}

/**
 * Alertes dérivées du dossier. Recalculées à chaque lecture plutôt que stockées :
 * le dossier reste la seule source de vérité. Une alerte marquée « traitée » par
 * le cabinet reste visible dans la fiche, mais sort de la file d'appels.
 */
export function alertes(patient, maintenant = new Date()) {
  const out = [];
  const s = patient.etapes;
  const j = joursAvant(patient, maintenant);
  const anesth = anesthesieDe(patient);
  const adm = patient.administratif;
  const pousser = (a) => out.push({ ...a, traitee: patient.alertesTraitees?.[a.code] ?? null });

  // — Prescription : une purge sur un terrain qui l'interdit.
  const protocole = examenDe(patient).purge ? PROTOCOLES[patient.examen.protocole] : null;
  const ci = protocole?.contreIndications.filter((c) => patient.terrain.comorbidites?.includes(c)) ?? [];
  if (ci.length) {
    pousser({
      code: 'PURGE_CONTRE_INDIQUEE', ton: 'ruby', source: 'dossier',
      titre: `${protocole.nom} contre-indiqué`,
      detail: `Terrain : ${ci.map((c) => comorbidite(c).label).join(', ')}.`,
      action: 'Revoir la prescription de préparation et rappeler le patient avec la nouvelle ordonnance',
    });
  }

  // — Déclarations J-7 : traitements.
  if (s.j7?.done) {
    for (const [id, ok] of Object.entries(s.j7.traitements ?? {})) {
      if (ok !== false) continue;
      const t = traitement(id);
      if (!t) continue;
      pousser({
        code: `TRAITEMENT_${id}`, ton: t.critique ? 'ruby' : 'amber', source: 'patient',
        titre: id === 'FER' ? 'Fer oral non arrêté' : `${t.label} : aucune consigne reçue`,
        detail: `${t.exemples}. Consigne usuelle : ${t.consigne}`,
        action: t.critique ? 'Rappeler le patient, obtenir l’avis du prescripteur et tracer la consigne' : 'Rappeler la consigne d’arrêt au patient',
      });
    }
    if (examenDe(patient).purge && !s.j7.purgeRecuperee) {
      pousser({
        code: 'PURGE_ABSENTE', ton: 'amber', source: 'patient',
        titre: 'Préparation non récupérée',
        detail: 'Le patient n’a pas encore la purge en sa possession.',
        action: 'Vérifier la délivrance en pharmacie',
      });
    }
    if (anesth.accompagnant && s.j7.accompagnant === false) {
      pousser({
        code: 'ACCOMPAGNANT', ton: 'amber', source: 'patient',
        titre: 'Pas d’accompagnant pour le retour',
        detail: 'Après une anesthésie, le patient ne peut ni conduire ni rentrer seul.',
        action: 'Trouver une solution avec le patient, ou convertir en examen sans anesthésie',
      });
    }
  }

  // — Terrain saisi par le cabinet : GLP-1 = estomac potentiellement plein.
  if (anesth.jeune && patient.terrain.traitements?.includes('GLP1')) {
    pousser({
      code: 'GLP1_ANESTHESISTE', ton: 'amber', source: 'dossier',
      titre: 'Patient sous agoniste du GLP-1',
      detail: 'Vidange gastrique ralentie : risque d’inhalation à l’induction, même à jeun.',
      action: 'Prévenir l’anesthésiste et imposer les liquides clairs la veille',
    });
  }

  // — Administratif, à l'approche de l'examen.
  if (anesth.cpa && !adm.cpa?.faite && j <= 5) {
    pousser({
      code: 'CPA', ton: j <= 2 ? 'ruby' : 'amber', source: 'cabinet',
      titre: 'Consultation d’anesthésie non faite',
      detail: `Examen ${j <= 0 ? 'aujourd’hui' : `dans ${j} jour${j > 1 ? 's' : ''}`}. La consultation est obligatoire au moins 48 h avant.`,
      action: 'Obtenir un rendez-vous d’anesthésie en urgence ou reporter',
    });
  }
  if (!adm.consentement && j <= 1) {
    pousser({
      code: 'CONSENTEMENT', ton: 'amber', source: 'cabinet',
      titre: 'Consentement non signé',
      detail: 'Le document d’information et de consentement n’est pas revenu au cabinet.',
      action: 'Demander au patient de l’apporter signé le jour de l’examen',
    });
  }

  // — Le patient n'a jamais ouvert le premier lien : il ne lit pas ses SMS.
  const envoiJ7 = ETAPES.j7.envoi(patient);
  const ouvert = patient.evenements?.some((e) => e.type === 'lien_ouvert');
  if (!s.j7?.done && !ouvert && maintenant - envoiJ7 > 36 * 3600 * 1000) {
    pousser({
      code: 'LIEN_NON_OUVERT', ton: 'amber', source: 'sms',
      titre: 'Lien jamais ouvert',
      detail: `SMS de J-7 envoyé le ${envoiJ7.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}, aucune ouverture depuis.`,
      action: 'Appeler le patient pour vérifier le numéro et la réception',
    });
  }

  // — Préparation colique.
  if (s.j3?.done && s.j3.ecarts?.length) {
    pousser({
      code: 'ECART_REGIME', ton: 'amber', source: 'patient',
      titre: `${s.j3.ecarts.length} écart${s.j3.ecarts.length > 1 ? 's' : ''} au régime sans résidu`,
      detail: s.j3.ecarts.join(', '),
      action: 'Renforcer la consigne ; envisager un lavement à l’arrivée',
    });
  }
  if (s.j1?.done && s.j1.tolerance === 'VOMI') {
    pousser({
      code: 'VOMISSEMENT_PURGE', ton: 'ruby', source: 'patient',
      titre: 'Rejet de la première fraction',
      detail: `${s.j1.verresBus} verre(s) sur ${protocole?.verres ?? 4}, puis vomissement. Volume ingéré insuffisant.`,
      action: 'Antiémétique, reprise lente, réévaluer à H-5',
    });
  }
  if (s.h5?.done && s.h5.evacuation <= 2) {
    pousser({
      code: 'EVACUATION_INSUFFISANTE', ton: 'ruby', source: 'patient',
      titre: 'Selles encore chargées à H-5',
      detail: 'Préparation non aboutie : le taux d’adénomes manqués est multiplié en l’état.',
      action: 'Lavement à l’arrivée, ou passage décalé en fin de vacation',
    });
  }

  // — Jeûne.
  if (s.h2?.done && s.h2.tabac) {
    pousser({
      code: 'TABAC_H2', ton: 'ruby', source: 'patient',
      titre: 'Tabac dans les 2 heures',
      detail: 'Sécrétion acide et vidange gastrique retardée : risque d’inhalation à l’induction.',
      action: 'Signaler à l’anesthésiste avant l’induction',
    });
  }
  if (s.h2?.done && !s.h2.jeuneSigne) {
    pousser({
      code: 'JEUNE_NON_SIGNE', ton: 'ruby', source: 'patient',
      titre: 'Jeûne non certifié',
      detail: 'Le patient n’a pas signé l’engagement de jeûne.',
      action: 'Contrôle verbal obligatoire à l’accueil',
    });
  }
  if (s.g1?.done && s.g1.liquidesClairs === false) {
    pousser({
      code: 'GLP1_REPAS', ton: 'ruby', source: 'patient',
      titre: 'Repas solide la veille sous GLP-1',
      detail: 'Le patient n’a pas suivi les liquides clairs : l’estomac peut encore contenir des aliments.',
      action: 'Prévenir l’anesthésiste ; décaler en fin de vacation si possible',
    });
  }

  // — Rectosigmoïdoscopie.
  if (s.r1?.done && !s.r1.lavementsEnMain) {
    pousser({
      code: 'LAVEMENTS_ABSENTS', ton: 'amber', source: 'patient',
      titre: 'Lavements non achetés',
      detail: 'Le patient n’a pas ses lavements pour le matin de l’examen.',
      action: 'Lui indiquer une pharmacie de garde, ou prévoir le lavement sur place',
    });
  }
  if (s.lav?.done && (s.lav.lavementsFaits < 2 || s.lav.resultat !== 'CLAIR')) {
    pousser({
      code: 'LAVEMENT_INEFFICACE', ton: 'amber', source: 'patient',
      titre: 'Lavements incomplets',
      detail: `${s.lav.lavementsFaits}/2 lavement(s), ${s.lav.resultat === 'CLAIR' ? 'retour clair' : 'retour encore chargé'}.`,
      action: 'Lavement complémentaire à l’arrivée',
    });
  }

  return out;
}

/** Les alertes qui demandent encore une action du cabinet. */
export const alertesActives = (patient, maintenant) => alertes(patient, maintenant).filter((a) => !a.traitee);
