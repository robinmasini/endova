import { ArrowLeft, MessageSquare } from '../components/icones.js';
import GlassCard from '../components/GlassCard.jsx';
import { Libelle } from '../components/ui.jsx';
import { useCabinet } from '../lib/store.js';
import { rediger } from '../lib/sms.js';
import { horodatage } from '../lib/patient.js';

/** Coque commune aux 5 écrans de l'échéancier : rappel du SMS reçu, contenu, CTA collant. */
export default function Coque({ etape, patient, onFermer, children, pied, lecture = false }) {
  const cabinet = useCabinet();
  const sms = rediger(etape.sms, patient, cabinet);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md px-5 pb-40 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)]">
      <button
        type="button"
        onClick={onFermer}
        className="flex items-center gap-2 text-xs text-slate-600 transition-colors hover:text-navy"
      >
        <ArrowLeft size={14} /> Échéancier
      </button>

      <div className="mt-5 rise">
        <Libelle>{etape.cle(patient)} · SMS du {horodatage(etape.envoi(patient))}</Libelle>
        <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-navy">{etape.titre}</h1>
      </div>

      <GlassCard className="mt-5 p-4 rise">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-magenta">
          <MessageSquare size={12} /> SMS reçu
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-700">{sms}</p>
      </GlassCard>

      <div className="mt-6 space-y-5">{children}</div>

      {pied ? (
        <div className="fixed inset-x-0 bottom-0 border-t border-navy/[0.09] bg-white/75 px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-4 backdrop-blur-2xl">
          <div className="mx-auto w-full max-w-md">{pied}</div>
        </div>
      ) : null}

      {lecture ? (
        <p className="mt-6 text-center text-[11px] text-slate-500">Étape déjà validée — affichage en lecture seule.</p>
      ) : null}
    </div>
  );
}
