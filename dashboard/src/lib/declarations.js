import { ECHELLE_EVACUATION } from './protocols.js';
import { traitement } from './terrain.js';
import { examenDe, anesthesieDe, protocoleDe, heure } from './patient.js';

/**
 * Ce que le patient a déclaré à chaque étape, en deux lectures :
 * `resume` tient sur une pastille, `lignes` détaille la déclaration dans la fiche.
 */
export function resume(patient, id) {
  const e = patient.etapes[id];
  if (!e?.done) return { texte: 'En attente', ton: 'neutre' };
  switch (id) {
    case 'j7': {
      const refus = Object.entries(e.traitements ?? {}).filter(([, ok]) => ok === false);
      if (refus.some(([t]) => traitement(t)?.critique)) return { texte: 'Traitement sans consigne', ton: 'ruby' };
      if (examenDe(patient).purge && !e.purgeRecuperee) return { texte: 'Purge non récupérée', ton: 'amber' };
      if (refus.length || e.accompagnant === false) return { texte: 'À compléter', ton: 'amber' };
      return { texte: 'Confirmé', ton: 'emerald' };
    }
    case 'j3':
      if (!e.regimeDemarre) return { texte: 'Régime non démarré', ton: 'ruby' };
      return e.ecarts?.length
        ? { texte: `${e.ecarts.length} écart${e.ecarts.length > 1 ? 's' : ''}`, ton: 'amber' }
        : { texte: 'Régime démarré', ton: 'emerald' };
    case 'j1': {
      const v = `${e.verresBus}/${protocoleDe(patient)?.verres ?? 4} verres`;
      return {
        COMPLETE: { texte: `${v} · tolérée`, ton: 'emerald' },
        PARTIELLE: { texte: `${v} · nausées`, ton: 'amber' },
        VOMI: { texte: `${v} · rejet`, ton: 'ruby' },
      }[e.tolerance];
    }
    case 'h5': {
      const ech = ECHELLE_EVACUATION.find((x) => x.id === e.evacuation);
      return { texte: ech?.verdict ?? '—', ton: e.evacuation >= 3 ? 'emerald' : e.evacuation === 2 ? 'amber' : 'ruby' };
    }
    case 'h2':
      if (!e.jeuneSigne) return { texte: 'Non signé', ton: 'ruby' };
      return e.tabac ? { texte: 'Signé · tabac déclaré', ton: 'ruby' } : { texte: 'Jeûne signé', ton: 'emerald' };
    case 'g1':
      if (e.liquidesClairs === false) return { texte: 'Repas solide la veille', ton: 'ruby' };
      return e.compris ? { texte: 'Consignes comprises', ton: 'emerald' } : { texte: 'Non confirmé', ton: 'amber' };
    case 'r1':
      return e.lavementsEnMain ? { texte: 'Lavements en main', ton: 'emerald' } : { texte: 'Lavements absents', ton: 'amber' };
    case 'lav':
      return e.lavementsFaits >= 2 && e.resultat === 'CLAIR'
        ? { texte: '2/2 · retour clair', ton: 'emerald' }
        : { texte: `${e.lavementsFaits}/2 · ${e.resultat === 'CLAIR' ? 'clair' : 'chargé'}`, ton: 'amber' };
    default:
      return { texte: '—', ton: 'neutre' };
  }
}

const oui = (b) => (b ? 'Oui' : 'Non');

/** Détail ligne à ligne, pour l'onglet Préparation. */
export function lignes(patient, id) {
  const e = patient.etapes[id];
  if (!e?.done) return [];
  switch (id) {
    case 'j7': {
      const out = [];
      if (examenDe(patient).purge) out.push(['Préparation récupérée', oui(e.purgeRecuperee), e.purgeRecuperee ? 'emerald' : 'amber']);
      for (const [tid, ok] of Object.entries(e.traitements ?? {})) {
        const t = traitement(tid);
        out.push([t?.label ?? tid, ok ? 'Consigne reçue' : 'Aucune consigne', ok ? 'emerald' : t?.critique ? 'ruby' : 'amber']);
      }
      if (anesthesieDe(patient).accompagnant) {
        out.push(['Accompagnant pour le retour', oui(e.accompagnant), e.accompagnant ? 'emerald' : 'amber']);
      }
      return out;
    }
    case 'j3':
      return [
        ['Régime démarré', oui(e.regimeDemarre), e.regimeDemarre ? 'emerald' : 'ruby'],
        ['Écarts déclarés', e.ecarts?.length ? e.ecarts.join(', ') : 'Aucun', e.ecarts?.length ? 'amber' : 'emerald'],
      ];
    case 'j1':
      return [
        ['Verres bus', `${e.verresBus} / ${protocoleDe(patient)?.verres ?? 4}`, e.tolerance === 'COMPLETE' ? 'emerald' : 'amber'],
        ['Tolérance', { COMPLETE: 'Complète', PARTIELLE: 'Nausées, incomplète', VOMI: 'Vomissement' }[e.tolerance], resume(patient, 'j1').ton],
      ];
    case 'h5': {
      const ech = ECHELLE_EVACUATION.find((x) => x.id === e.evacuation);
      return [
        ['Seconde fraction', e.tolerance === 'COMPLETE' ? 'Bue intégralement' : 'Partielle', e.tolerance === 'COMPLETE' ? 'emerald' : 'amber'],
        ['Aspect des selles', `${ech?.titre} — Boston ${ech?.boston}`, resume(patient, 'h5').ton],
      ];
    }
    case 'h2':
      return [
        ['Engagement de jeûne', e.jeuneSigne ? 'Signé' : 'Non signé', e.jeuneSigne ? 'emerald' : 'ruby'],
        ['Tabac depuis H-2', oui(e.tabac), e.tabac ? 'ruby' : 'emerald'],
        ...(e.heureDernierApport ? [['Dernier apport déclaré', heure(e.heureDernierApport), 'neutre']] : []),
      ];
    case 'g1':
      return [
        ['Consignes de jeûne comprises', oui(e.compris), e.compris ? 'emerald' : 'amber'],
        ...(e.liquidesClairs !== undefined && e.liquidesClairs !== null
          ? [['Liquides clairs la veille (GLP-1)', oui(e.liquidesClairs), e.liquidesClairs ? 'emerald' : 'ruby']]
          : []),
      ];
    case 'r1':
      return [['Lavements achetés', oui(e.lavementsEnMain), e.lavementsEnMain ? 'emerald' : 'amber']];
    case 'lav':
      return [
        ['Lavements faits', `${e.lavementsFaits} / 2`, e.lavementsFaits >= 2 ? 'emerald' : 'amber'],
        ['Retour', e.resultat === 'CLAIR' ? 'Clair' : 'Encore chargé', e.resultat === 'CLAIR' ? 'emerald' : 'amber'],
      ];
    default:
      return [];
  }
}
