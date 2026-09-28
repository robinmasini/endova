import { Link } from 'react-router-dom';
import { Check, Clock, Send, AlertTriangle, Eye } from '../components/icones.js';
import { useDossiers } from '../lib/store.js';
import { ETAPES, etapesDe, joursAvant } from '../lib/examens.js';
import { planSms, prochainsEnvois } from '../lib/sms.js';
import { heure, horodatage, nomComplet } from '../lib/patient.js';
import { EnTete } from './Coquille.jsx';

/** Ordre chronologique du catalogue : une colonne n'apparaît que si un examen l'utilise. */
const ORDRE = ['j7', 'j3', 'g1', 'r1', 'j1', 'h5', 'lav', 'h2'];

const STYLE = {
  repondu: 'border-emerald-400/50 bg-emerald-50/70 text-emerald-700',
  incident: 'border-rose-400/50 bg-rose-50/70 text-rose-700',
  ouvert: 'border-magenta/35 bg-magenta/[0.08] text-magenta',
  envoye: 'border-amber-400/50 bg-amber-50/70 text-amber-700',
  planifie: 'border-navy/[0.07] bg-white/50 text-slate-500',
};

const ICONE = { repondu: Check, incident: AlertTriangle, ouvert: Eye, envoye: Send, planifie: Clock };

function Jeton({ patient, sms }) {
  const incident = sms.statut === 'repondu' && sms.reponse?.ton === 'ruby';
  const etat = incident ? 'incident' : sms.statut;
  const Icone = ICONE[etat];
  return (
    <Link
      to={`/patients/${patient.id}?onglet=sms`}
      title={`${nomComplet(patient)} — ${horodatage(sms.envoi)}`}
      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition-all hover:brightness-95 ${STYLE[etat]}`}
    >
      <Icone size={12} strokeWidth={etat === 'repondu' ? 3 : 2} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate font-medium">
        {patient.identite.nom} {patient.identite.prenom[0]}.
      </span>
      <span className="shrink-0 text-[10px] tabular-nums opacity-70">{new Date(sms.envoi).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
    </Link>
  );
}

export default function Echeancier() {
  const { patients, cabinet } = useDossiers();
  const aVenir = patients.filter((p) => joursAvant(p) >= 0);
  const plans = aVenir.map((p) => ({ patient: p, plan: planSms(p, cabinet) }));
  const utilisees = ORDRE.filter((id) => aVenir.some((p) => etapesDe(p).some((e) => e.id === id)));
  const envois = prochainsEnvois(aVenir, cabinet);
  const nonOuverts = plans.flatMap(({ patient, plan }) => plan.filter((s) => s.statut === 'envoye').map((s) => ({ patient, s })));

  return (
    <>
      <EnTete titre="Échéancier SMS" question="Ce qui est parti, ce qui a été lu, ce qui part ensuite — pour chaque examen." />

      <div className="px-5 pt-6 sm:px-8">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-navy/[0.07] bg-white/60 p-4 backdrop-blur-2xl">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600"><Clock size={14} /> Prochaines 24 heures · {envois.length}</p>
            {envois.length ? (
              <ol className="space-y-1.5">
                {envois.map((s) => (
                  <li key={`${s.patient.id}-${s.etape.id}`} className="flex items-center gap-3 text-sm">
                    <span className="w-12 shrink-0 font-bold tabular-nums text-navy">{heure(s.envoi)}</span>
                    <Link to={`/patients/${s.patient.id}?onglet=sms`} className="min-w-0 flex-1 truncate text-slate-700 hover:text-magenta">
                      {nomComplet(s.patient)} <span className="text-slate-400">· {s.cle} {s.etape.titre}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : <p className="text-xs text-slate-500">Aucun envoi d’ici demain.</p>}
          </section>
          <section className={`rounded-2xl border p-4 ${nonOuverts.length ? 'border-amber-400/50 bg-amber-50/60' : 'border-navy/[0.07] bg-white/60'}`}>
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600"><Send size={14} /> Délivrés, pas encore ouverts · {nonOuverts.length}</p>
            {nonOuverts.length ? (
              <ol className="space-y-1.5">
                {nonOuverts.map(({ patient, s }) => (
                  <li key={`${patient.id}-${s.etape.id}`} className="flex items-center gap-3 text-sm">
                    <span className="w-12 shrink-0 font-bold text-amber-700">{s.cle}</span>
                    <Link to={`/patients/${patient.id}?onglet=sms`} className="min-w-0 flex-1 truncate text-slate-700 hover:text-magenta">
                      {nomComplet(patient)} <span className="text-slate-400">· envoyé {horodatage(s.envoi)}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : <p className="text-xs text-slate-500">Tous les SMS envoyés ont été ouverts.</p>}
          </section>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8">
          {utilisees.map((id) => {
            const etape = ETAPES[id];
            const lignes = plans
              .map(({ patient, plan }) => ({ patient, sms: plan.find((s) => s.etape.id === id) }))
              .filter((l) => l.sms)
              .sort((a, b) => a.sms.envoi - b.sms.envoi);
            return (
              <section key={id} className="rounded-2xl border border-navy/[0.07] bg-white/60 p-4 backdrop-blur-2xl">
                <div className="border-b border-navy/[0.07] pb-3">
                  <p className="text-sm font-bold text-navy">{etape.titre}</p>
                  <p className="mt-0.5 text-[11px] text-slate-600">{lignes.length} patient{lignes.length > 1 ? 's' : ''}</p>
                </div>
                <div className="mt-3 space-y-1.5">
                  {lignes.map(({ patient, sms }) => <Jeton key={patient.id} patient={patient} sms={sms} />)}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-slate-600">
          {[['repondu', 'Répondu'], ['incident', 'Répondu avec incident'], ['ouvert', 'Lien ouvert'], ['envoye', 'Délivré, non ouvert'], ['planifie', 'Programmé']].map(([k, l]) => {
            const I = ICONE[k];
            return <span key={k} className="flex items-center gap-1.5"><span className={`flex size-5 items-center justify-center rounded border ${STYLE[k]}`}><I size={10} /></span>{l}</span>;
          })}
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
          Un SMS répondu avec incident reste en rouge : l’étape est close, le risque ne l’est pas.
        </p>
      </div>
    </>
  );
}
