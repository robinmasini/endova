/**
 * Le jalon : la signature visuelle de l'outil.
 *
 * Partout où un repère temporel s'affiche — J-7, H-5, J-J — il porte le glyphe
 * Endova. Un échéancier n'est pas une liste de dates : c'est un compte à
 * rebours vers un seul moment, et le jalon le dit d'un coup d'œil.
 *
 * Le compte à rebours s'arrête au jour J. L'outil est préopératoire.
 */

const GLYPHE = {
  clair: 'endova-glyphe.png',
  plein: 'favicon.png',
};

const TONS = {
  clair: 'bg-white text-magenta shadow-[0_1px_3px_rgba(5,28,78,0.10),0_6px_16px_-8px_rgba(5,28,78,0.18)] ring-1 ring-navy/[0.06]',
  plein: 'bg-magenta text-white shadow-[0_2px_8px_-2px_rgba(147,43,156,0.45)]',
  sourd: 'bg-navy/[0.05] text-slate-500 ring-1 ring-navy/[0.05]',
};

const TAILLES = {
  xs: { boite: 'h-6 gap-1 pl-1 pr-2', image: 'h-4', texte: 'text-[10px]' },
  s: { boite: 'h-7 gap-1.5 pl-1.5 pr-2.5', image: 'h-[18px]', texte: 'text-[11px]' },
  m: { boite: 'h-9 gap-2 pl-2 pr-3.5', image: 'h-6', texte: 'text-sm' },
  l: { boite: 'h-12 gap-2.5 pl-2.5 pr-5', image: 'h-8', texte: 'text-lg' },
};

/** « J-7 » devient « J - 7 » : c'est l'espace qui donne l'allure. */
function espacer(texte) {
  return /^[A-Z]-[A-Z0-9]+$/.test(texte) ? texte.replace('-', ' - ') : texte;
}

export default function Jalon({ children, ton = 'clair', taille = 's', className = '' }) {
  const t = TAILLES[taille] ?? TAILLES.s;
  const glyphe = GLYPHE[ton] ?? GLYPHE.clair;
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full font-marque font-semibold tracking-[0.04em] tabular-nums ${TONS[ton] ?? TONS.clair} ${t.boite} ${t.texte} ${className}`}>
      <img
        src={`${import.meta.env.BASE_URL}${glyphe}`}
        alt=""
        aria-hidden="true"
        className={`${t.image} w-auto select-none`}
        draggable={false}
      />
      <span className="leading-none">{espacer(String(children))}</span>
    </span>
  );
}
