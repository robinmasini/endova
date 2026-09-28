import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Send, CheckCircle2, Clock, X } from './icones.js';
import { store, useDossiers } from '../lib/store.js';
import { smsEchus, prochainsEnvois } from '../lib/sms.js';
import { heure, horodatage, nomComplet } from '../lib/patient.js';

/** « Maintenant », rafraîchi chaque minute : un SMS devient échu sans que rien d'autre ne bouge. */
function useMaintenant() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

function Resultat({ lot, prochain, onFermer }) {
  const patients = new Set(lot.map((s) => s.patient.id)).size;
  return (
    <>
      <button type="button" aria-label="Fermer" onClick={onFermer} className="fixed inset-0 z-[60] bg-navy/25 backdrop-blur-sm" />
      <div role="dialog" aria-modal="true" aria-labelledby="scan-titre" className="fixed inset-x-4 bottom-24 z-[70] mx-auto max-w-md rise md:bottom-auto md:top-1/2 md:-translate-y-1/2">
        <div className="max-h-[70dvh] overflow-y-auto rounded-3xl border border-white/80 bg-white/95 p-6 shadow-[0_30px_80px_-20px_rgba(5,28,78,0.45)]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={`flex size-11 items-center justify-center rounded-2xl ${lot.length ? 'bg-magenta/[0.1] text-magenta' : 'bg-emerald-50 text-emerald-700'}`}>
                {lot.length ? <Send size={19} /> : <CheckCircle2 size={19} />}
              </span>
              <div>
                <p id="scan-titre" className="text-base font-bold text-navy">
                  {lot.length ? `${lot.length} SMS délivré${lot.length > 1 ? 's' : ''}` : 'Rien à envoyer'}
                </p>
                <p className="text-xs text-slate-600">
                  {lot.length ? `à ${patients} patient${patients > 1 ? 's' : ''}, chacun à son échéance` : 'Tous les SMS échus sont déjà partis.'}
                </p>
              </div>
            </div>
            <button type="button" onClick={onFermer} aria-label="Fermer" className="rounded-lg p-1.5 text-slate-500 hover:bg-navy/[0.05] hover:text-navy">
              <X size={17} />
            </button>
          </div>

          {lot.length ? (
            <ol className="mt-5 space-y-2">
              {lot.map((s) => (
                <li key={`${s.patient.id}-${s.etape.id}`}>
                  <Link
                    to={`/patients/${s.patient.id}?onglet=sms`}
                    onClick={onFermer}
                    className="flex items-center gap-3 rounded-xl border border-navy/[0.07] bg-white/70 p-3 transition-colors hover:bg-white"
                  >
                    <span className="w-10 shrink-0 text-xs font-bold text-magenta">{s.cle}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-navy">{nomComplet(s.patient)}</span>
                      <span className="block truncate text-[11px] text-slate-500">{s.etape.titre} · prévu {horodatage(s.envoi)}</span>
                    </span>
                    <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                  </Link>
                </li>
              ))}
            </ol>
          ) : null}

          {prochain ? (
            <p className="mt-5 flex items-center gap-2 rounded-xl bg-navy/[0.04] px-3.5 py-3 text-xs text-slate-600">
              <Clock size={13} className="shrink-0" />
              Prochain SMS : {nomComplet(prochain.patient)}, {prochain.cle} à {heure(prochain.envoi)}.
            </p>
          ) : null}
          <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
            Chaque envoi est horodaté dans la traçabilité du patient. Aucun SMS ne part après l’heure de l’examen.
          </p>
        </div>
      </div>
    </>
  );
}

/**
 * Le bouton Endova : un scan délivre tous les SMS arrivés à échéance, pour tous
 * les patients, et rien de plus. Le glyphe tourne pendant l'envoi.
 */
export default function ScanSms({ bureau = false }) {
  const { patients, cabinet } = useDossiers();
  const maintenant = useMaintenant();
  const [phase, setPhase] = useState('repos');
  const [lot, setLot] = useState([]);
  const enAttente = smsEchus(patients, cabinet, maintenant).length;

  function scanner() {
    if (phase !== 'repos') return;
    setPhase('scan');
    // Le temps de voir partir les messages : un scan instantané passe inaperçu.
    setTimeout(() => {
      setLot(store.scannerSms());
      setPhase('resultat');
    }, 1300);
  }

  const prochain = phase === 'resultat' ? prochainsEnvois(patients, cabinet, new Date(), 24 * 8)[0] : null;
  const scan = phase === 'scan';

  const bouton = (
    <button
      type="button"
      onClick={scanner}
      aria-label={enAttente ? `Scan SMS — ${enAttente} message${enAttente > 1 ? 's' : ''} à envoyer` : 'Scan SMS'}
      className={`group relative flex items-center justify-center rounded-full bg-white shadow-[0_6px_18px_-3px_rgba(5,28,78,0.3)] transition-transform active:scale-95 ${
        bureau ? 'size-[4.5rem] hover:scale-105' : 'size-16'
      }`}
    >
      {/* Anneau irisé : il tourne pendant le scan, respire quand des SMS attendent. */}
      <span
        aria-hidden="true"
        className={`absolute -inset-1 rounded-full transition-opacity duration-500 ${scan ? 'animate-spin opacity-100' : enAttente ? 'opacity-70' : 'opacity-0'}`}
        style={{
          background: 'conic-gradient(from 0deg, #932B9C, #E6A8F0, #5B6CFF, #52237F, #932B9C)',
          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))',
          animationDuration: '1.1s',
        }}
      />
      {enAttente && !scan ? <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-magenta/20 [animation-duration:2.6s]" /> : null}
      <img
        src={`${import.meta.env.BASE_URL}endova-glyphe.png`}
        alt=""
        className={`relative transition-transform duration-500 ${bureau ? 'size-14' : 'size-12'} ${scan ? 'scale-90' : ''}`}
      />
      {enAttente && !scan ? (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white ring-2 ring-white">
          {enAttente}
        </span>
      ) : null}
    </button>
  );

  return (
    <>
      {bureau ? (
        <div className="fixed bottom-6 right-6 z-40 hidden items-center gap-3 md:flex print:!hidden">
          <span className={`rounded-full border border-white/80 bg-white/85 px-3.5 py-2 text-xs font-semibold shadow-[0_8px_20px_-10px_rgba(5,28,78,0.35)] backdrop-blur-xl transition-colors ${enAttente ? 'text-magenta' : 'text-slate-600'}`}>
            {scan ? 'Envoi en cours…' : enAttente ? `Scan SMS · ${enAttente} à envoyer` : 'Scan SMS'}
          </span>
          {bouton}
        </div>
      ) : (
        bouton
      )}
      {/* Portail : la barre mobile a un backdrop-filter, qui piégerait la fenêtre fixe. */}
      {phase === 'resultat' ? createPortal(<Resultat lot={lot} prochain={prochain} onFermer={() => setPhase('repos')} />, document.body) : null}
    </>
  );
}
