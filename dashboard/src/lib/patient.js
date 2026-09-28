import { EXAMENS, ANESTHESIES, joursAvant } from './examens.js';
import { PROTOCOLES } from './protocols.js';

/** Petites lectures du dossier, partagées par toutes les vues. */

export const age = (p, maintenant = new Date()) => {
  const n = new Date(p.identite.naissance);
  let a = maintenant.getFullYear() - n.getFullYear();
  const m = maintenant.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && maintenant.getDate() < n.getDate())) a -= 1;
  return a;
};

export const anneeNaissance = (p) => Number(p.identite.naissance.slice(0, 4));
export const nomComplet = (p) => `${p.identite.nom.toUpperCase()} ${p.identite.prenom}`;
export const examenDe = (p) => EXAMENS[p.examen.type];
export const anesthesieDe = (p) => ANESTHESIES[p.examen.anesthesie];
export const protocoleDe = (p) => (EXAMENS[p.examen.type].purge ? PROTOCOLES[p.examen.protocole] : null);

export const heure = (d) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
export const jour = (d) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
export const jourCourt = (d) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
export const horodatage = (d) =>
  new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
export const dateLongue = (d) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** « aujourd'hui », « demain », « dans 3 jours » — ce que dit la secrétaire au téléphone. */
export function echeance(p, maintenant = new Date()) {
  const j = joursAvant(p, maintenant);
  if (j < 0) return 'passé';
  if (j === 0) return 'aujourd’hui';
  if (j === 1) return 'demain';
  return `dans ${j} jours`;
}

export const telephoneLisible = (t) =>
  t.startsWith('+33') ? `0${t.slice(3)}`.replace(/(\d{2})(?=\d)/g, '$1 ') : t;
