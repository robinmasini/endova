import { useSearchParams } from 'react-router-dom';
import { Eye, CalendarClock } from '../components/icones.js';
import ApercuSuivi from './ApercuSuivi.jsx';
import Echeancier from './Echeancier.jsx';

/**
 * Aperçu : tout ce qui touche aux SMS, au même endroit.
 * La séquence type d'un côté, l'état réel des envois de l'autre.
 */
const VUES = [
  { id: 'suivi', label: 'Aperçu du suivi', icone: Eye, composant: ApercuSuivi },
  { id: 'echeancier', label: 'Échéancier SMS', icone: CalendarClock, composant: Echeancier },
];

export default function Apercu() {
  const [params, setParams] = useSearchParams();
  const vue = VUES.find((v) => v.id === params.get('vue')) ?? VUES[0];
  const Contenu = vue.composant;

  return (
    <>
      <nav aria-label="Vues de l’aperçu" className="flex gap-1.5 overflow-x-auto px-5 pt-[calc(env(safe-area-inset-top,0px)+1rem)] [scrollbar-width:none] sm:px-8">
        {VUES.map((v) => {
          const actif = v.id === vue.id;
          return (
            <button
              key={v.id}
              type="button"
              aria-current={actif ? 'page' : undefined}
              onClick={() => setParams(v.id === 'suivi' ? {} : { vue: v.id }, { replace: true })}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
                actif ? 'cta-violet border-navy bg-navy font-semibold text-white' : 'border-navy/[0.1] bg-white/70 font-medium text-slate-600 hover:text-navy'
              }`}
            >
              <v.icone size={15} /> {v.label}
            </button>
          );
        })}
      </nav>
      <Contenu />
    </>
  );
}
