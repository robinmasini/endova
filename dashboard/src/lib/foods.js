/**
 * Régime sans résidu strict. Le critère n'est pas diététique mais mécanique :
 * tout ce qui laisse une particule obstrue le canal d'aspiration de 3,2 mm
 * de l'endoscope, ou masque la muqueuse.
 */
export const ALIMENTS = [
  { nom: 'Riz blanc', ok: true, cat: 'Féculents' },
  { nom: 'Pâtes non complètes', ok: true, cat: 'Féculents' },
  { nom: 'Pain de mie blanc', ok: true, cat: 'Féculents' },
  { nom: 'Semoule fine', ok: true, cat: 'Féculents' },
  { nom: 'Pomme de terre sans peau', ok: true, cat: 'Féculents' },
  { nom: 'Blanc de dinde', ok: true, cat: 'Protéines' },
  { nom: 'Poulet grillé', ok: true, cat: 'Protéines' },
  { nom: 'Jambon blanc découenné', ok: true, cat: 'Protéines' },
  { nom: 'Poisson blanc vapeur', ok: true, cat: 'Protéines' },
  { nom: 'Œufs', ok: true, cat: 'Protéines' },
  { nom: 'Fromage à pâte dure', ok: true, cat: 'Produits laitiers' },
  { nom: 'Bouillon filtré', ok: true, cat: 'Boissons' },
  { nom: 'Thé léger, café sans lait', ok: true, cat: 'Boissons' },
  { nom: 'Eau, eau gazeuse', ok: true, cat: 'Boissons' },
  { nom: 'Miel, gelée de fruits filtrée', ok: true, cat: 'Sucré' },
  { nom: 'Biscuits secs type boudoir', ok: true, cat: 'Sucré' },

  { nom: 'Fruits rouges (fraise, framboise)', ok: false, cat: 'Fruits', motif: 'Les akènes restent visibles jusqu’au colon et bouchent l’aspiration' },
  { nom: 'Kiwi', ok: false, cat: 'Fruits', motif: 'Graines noires non digérées, très fréquentes en endoscopie' },
  { nom: 'Tomate (pépins et peau)', ok: false, cat: 'Légumes', motif: 'Pépins et peau non digestibles' },
  { nom: 'Raisin', ok: false, cat: 'Fruits', motif: 'Pépins et peau' },
  { nom: 'Pain complet, aux céréales', ok: false, cat: 'Féculents', motif: 'Son et graines = résidus massifs' },
  { nom: 'Céréales complètes, muesli', ok: false, cat: 'Féculents', motif: 'Fibres insolubles' },
  { nom: 'Légumes verts, salade', ok: false, cat: 'Légumes', motif: 'Fibres insolubles masquant la muqueuse' },
  { nom: 'Légumes secs (lentilles, pois chiches)', ok: false, cat: 'Légumes', motif: 'Enveloppes cellulosiques indigestes' },
  { nom: 'Graines (lin, sésame, chia, pavot)', ok: false, cat: 'Divers', motif: 'Cause n°1 d’examen ininterprétable' },
  { nom: 'Fruits à coque, oléagineux', ok: false, cat: 'Divers', motif: 'Fragments durs non digérés' },
  { nom: 'Maïs', ok: false, cat: 'Légumes', motif: 'Péricarpe intact dans les selles' },
  { nom: 'Lait, yaourt, crème', ok: false, cat: 'Produits laitiers', motif: 'Lactose : résidus et ballonnements' },
  { nom: 'Boissons rouges ou violettes', ok: false, cat: 'Boissons', motif: 'Colorant confondu avec du sang à l’endoscopie' },
];

export const CATEGORIES = [...new Set(ALIMENTS.map((a) => a.cat))];
