const GLOW = {
  none: 'border-white/70',
  emerald: 'border-emerald-400/50 shadow-[0_0_0_1px_rgba(16,185,129,0.12),0_10px_30px_-8px_rgba(4,120,87,0.22)]',
  amber: 'border-amber-400/55 shadow-[0_0_0_1px_rgba(245,158,11,0.14),0_10px_30px_-8px_rgba(180,83,9,0.22)]',
  ruby: 'border-rose-400/55 shadow-[0_0_0_1px_rgba(190,18,60,0.14),0_10px_32px_-8px_rgba(190,18,60,0.26)]',
  cyan: 'border-magenta/35 shadow-[0_0_0_1px_rgba(147,43,156,0.12),0_10px_30px_-8px_rgba(147,43,156,0.22)]',
};

/**
 * Surface Liquid Glass claire.
 *
 * `plat` retire le backdrop-filter : imbriquer deux backdrop-filter casse la
 * composition du sous-arbre sous Chromium (le contenu cesse d'être peint alors
 * qu'il reste bien dans le DOM). Toute carte posée dans un conteneur déjà flouté
 * — la fiche patient, par exemple — doit donc être plate, et compense par un
 * fond plus opaque.
 */
export function GlassCard({ children, className = '', glow = 'none', deep = false, plat = false, ...rest }) {
  return (
    <div
      className={`relative rounded-2xl border transition-all duration-300 ${
        plat ? 'bg-white/72' : 'bg-white/55 backdrop-blur-2xl backdrop-saturate-[180%]'
      } ${deep ? 'glass-refraction-deep' : 'glass-refraction'} ${GLOW[glow]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export default GlassCard;
