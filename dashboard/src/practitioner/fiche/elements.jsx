import { TONS } from '../../components/ui.jsx';

/** Bloc de fiche : un titre, une seule question, son contenu. */
export function Carte({ titre, icone, action, children, className = '', note }) {
  return (
    <section className={`rounded-2xl border border-white/80 bg-white/70 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.95),0_1px_2px_0_rgba(5,28,78,0.04),0_10px_28px_-10px_rgba(5,28,78,0.12)] ${className}`}>
      {titre ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
            {icone} {titre}
          </p>
          {action}
        </div>
      ) : null}
      {children}
      {note ? <p className="mt-4 text-[11px] leading-relaxed text-slate-500">{note}</p> : null}
    </section>
  );
}

/** Ligne libellé / valeur. La valeur vide s'affiche en tiret, jamais en blanc. */
export function Champ({ libelle, children, ton }) {
  const vide = children === null || children === undefined || children === '';
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-navy/[0.06] py-2.5 last:border-0 last:pb-0 first:pt-0">
      <dt className="shrink-0 text-xs text-slate-600">{libelle}</dt>
      <dd className={`min-w-0 text-right text-sm font-medium ${ton ? TONS[ton].texte : 'text-navy'} ${vide ? 'text-slate-400' : ''}`}>
        {vide ? '—' : children}
      </dd>
    </div>
  );
}

export function Pastille({ ton = 'neutre', children, className = '' }) {
  const t = TONS[ton];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${t.fond} ${t.texte} ${className}`}>
      {children}
    </span>
  );
}

export function Puce({ ton = 'neutre', children }) {
  const t = TONS[ton];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${t.bord} ${t.fond} ${t.texte}`}>
      {children}
    </span>
  );
}

export function BoutonDiscret({ children, className = '', ...rest }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-lg border border-navy/[0.09] bg-white/70 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-white hover:text-navy disabled:opacity-40 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
