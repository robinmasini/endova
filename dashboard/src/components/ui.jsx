import { Check } from './icones.js';

/**
 * Tons cliniques sur fond clair. Le texte descend en 700 pour tenir le contraste
 * AA sur du verre blanc, tandis que les aplats (`trait`, `brut`) restent en 500/600
 * pour garder de la saturation à l'écran.
 */
export const TONS = {
  emerald: { texte: 'text-emerald-700', bord: 'border-emerald-400/50', fond: 'bg-emerald-50/80', trait: 'bg-emerald-500', brut: '#059669' },
  amber: { texte: 'text-amber-700', bord: 'border-amber-400/55', fond: 'bg-amber-50/80', trait: 'bg-amber-500', brut: '#D97706' },
  ruby: { texte: 'text-rose-700', bord: 'border-rose-400/55', fond: 'bg-rose-50/80', trait: 'bg-rose-500', brut: '#BE123C' },
  marque: { texte: 'text-magenta', bord: 'border-magenta/35', fond: 'bg-magenta/[0.07]', trait: 'bg-magenta', brut: '#932B9C' },
  neutre: { texte: 'text-slate-600', bord: 'border-navy/10', fond: 'bg-navy/[0.035]', trait: 'bg-slate-400', brut: '#64748B' },
};

export function Badge({ ton = 'neutre', children, className = '' }) {
  const t = TONS[ton];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${t.bord} ${t.fond} ${t.texte} ${className}`}>
      {children}
    </span>
  );
}

export function Libelle({ children, className = '' }) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-wider text-slate-600 ${className}`}>{children}</p>
  );
}

/** Anneau de score : l'arc se remplit et prend le ton du risque. */
export function AnneauScore({ valeur, ton = 'marque', taille = 128, epaisseur = 9, children }) {
  const r = (taille - epaisseur) / 2;
  const circonference = 2 * Math.PI * r;
  const rempli = circonference * (1 - Math.min(100, Math.max(0, valeur)) / 100);
  return (
    <div className="relative shrink-0" style={{ width: taille, height: taille }}>
      <svg width={taille} height={taille} className="-rotate-90">
        <circle cx={taille / 2} cy={taille / 2} r={r} fill="none" stroke="rgba(5,28,78,0.08)" strokeWidth={epaisseur} />
        <circle
          cx={taille / 2} cy={taille / 2} r={r} fill="none"
          stroke={TONS[ton].brut} strokeWidth={epaisseur} strokeLinecap="round"
          strokeDasharray={circonference} strokeDashoffset={rempli}
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.16,1,0.3,1), stroke 0.4s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

export function Bouton({ ton = 'marque', children, className = '', ...rest }) {
  const t = TONS[ton];
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-sm font-semibold transition-all duration-200 hover:brightness-[0.97] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:brightness-100 ${t.bord} ${t.fond} ${t.texte} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Carte à cocher : la cible de clic est toute la surface, doigts compris. */
export function CarteChoix({ actif, onClick, ton = 'marque', titre, detail, icone, className = '' }) {
  const t = TONS[actif ? ton : 'neutre'];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200 ${
        actif ? `${t.bord} ${t.fond}` : 'border-navy/8 bg-white/55 hover:border-navy/15 hover:bg-white/80'
      } ${className}`}
    >
      {icone ? <span className={`mt-0.5 shrink-0 ${actif ? t.texte : 'text-slate-500'}`}>{icone}</span> : null}
      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-medium ${actif ? 'text-navy' : 'text-slate-800'}`}>{titre}</span>
        {detail ? <span className="mt-1 block text-xs leading-relaxed text-slate-600">{detail}</span> : null}
      </span>
      <span
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-all ${
          actif ? `${t.bord} ${t.fond}` : 'border-navy/15 bg-white/60'
        }`}
      >
        {actif ? <Check size={12} className={t.texte} strokeWidth={3} /> : null}
      </span>
    </button>
  );
}

export function Bascule({ actif, onChange, label, detail }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      onClick={() => onChange(!actif)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-navy/8 bg-white/55 p-4 text-left transition-colors hover:bg-white/80"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-navy">{label}</span>
        {detail ? <span className="mt-1 block text-xs text-slate-600">{detail}</span> : null}
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${actif ? 'bg-emerald-500' : 'bg-navy/15'}`}>
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform ${actif ? 'translate-x-5.5' : 'translate-x-0.5'}`}
        />
      </span>
    </button>
  );
}

/** Verrouille le nom de marque et son pictogramme au même endroit. */
export function Marque({ taille = 'md', className = '' }) {
  const dim = { sm: 'size-7', md: 'size-9', lg: 'size-11' }[taille];
  const texte = { sm: 'text-[11px]', md: 'text-sm', lg: 'text-base' }[taille];
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img src={`${import.meta.env.BASE_URL}endova-mark.png`} alt="" className={`${dim} shrink-0 rounded-lg`} />
      <span className={`font-marque font-semibold tracking-[0.28em] text-navy ${texte}`}>ENDOVA</span>
    </div>
  );
}
