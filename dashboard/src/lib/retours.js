import { alertesActives } from './score.js';
import { etapesDe } from './examens.js';
import { anesthesieDe, examenDe } from './patient.js';

/**
 * Les retours du patient, en pastilles.
 *
 * Une pastille dit une chose manquante ou déclarée de travers, assez court
 * pour se lire d'un coup d'œil dans une liste. Elles viennent de quatre
 * endroits, et l'ordre compte : ce qui met l'examen en péril d'abord, ce qui
 * relève du secrétariat ensuite.
 *
 * Ce n'est pas un doublon des alertes : une alerte explique et propose une
 * conduite à tenir, une pastille signale. Les deux lisent le même dossier.
 */

const TONS = {
  ruby: 'border-rose-300 bg-rose-50 text-rose-700',
  amber: 'border-amber-300 bg-amber-50 text-amber-800',
  neutre: 'border-navy/[0.12] bg-navy/[0.04] text-slate-600',
  emerald: 'border-emerald-300 bg-emerald-50 text-emerald-700',
};

export const TON_PASTILLE = TONS;

export function retoursPatient(patient, maintenant = new Date()) {
  const out = [];
  const pousser = (texte, ton = 'amber') => out.push({ texte, ton });

  // 1. Ce que le patient a déclaré et qui coince : les alertes actives.
  const alertes = alertesActives(patient);
  const codes = new Set(alertes.map((a) => a.code));
  for (const a of alertes) pousser(a.titre, a.ton);

  // 2. Les questionnaires échus restés sans réponse.
  for (const e of etapesDe(patient)) {
    if (patient.etapes[e.id]?.done) continue;
    if (e.envoi(patient) > maintenant) continue;
    pousser(`Questionnaire ${e.cle(patient)} non rempli`, 'amber');
  }

  // 3. Le patient n'a jamais ouvert son espace : rien ne remontera de lui.
  const ouvert = patient.evenements?.some((e) => e.type === 'lien_ouvert');
  if (!ouvert && !codes.has('LIEN_NON_OUVERT')) pousser('Espace patient jamais ouvert', 'neutre');

  // 4. Ce qui manque au dossier, côté cabinet.
  const adm = patient.administratif ?? {};
  // Une alerte dit déjà la même chose, en mieux : elle porte une conduite à
  // tenir. On ne la double pas d'une pastille.
  if (anesthesieDe(patient).cpa && !adm.cpa?.faite && !codes.has('CPA') && !codes.has('CPA_PATIENT')) {
    pousser('Consultation d’anesthésie à programmer', 'ruby');
  }
  if (!adm.consentement && !codes.has('CONSENTEMENT')) pousser('Consentement à recueillir', 'amber');
  if (examenDe(patient).purge && !adm.ordonnance && !codes.has('PURGE_ABSENTE')) {
    pousser('Ordonnance de préparation à remettre', 'amber');
  }
  if (!adm.bonAdmission) pousser('Bon d’admission à établir', 'neutre');

  return out;
}

/** Rien à signaler : la liste doit pouvoir le dire, pas seulement rester vide. */
export const toutEnOrdre = (patient) => retoursPatient(patient).length === 0;
