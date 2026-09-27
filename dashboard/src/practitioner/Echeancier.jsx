import { Link } from 'react-router-dom';
import { Check, Clock, Send, AlertTriangle } from '../components/icones.js';
import { useDossiers } from '../lib/store.js';
import { ETAPES } from '../lib/protocols.js';
import { alertes } from '../lib/score.js';
import { EnTete } from './Coquille.jsx';

/** Statut d'une étape pour un patient donné : faite, en cours, ou pas encore échue. */
function statut(patient, index) {
  if (patient.etapes[ETAPES[index].id]?.done) return 'fait';
  const premiereOuverte = ETAPES.findIndex((e) => !patient.etapes[e.id]?.done);
  return index === premiereOuverte ? 'encours' : 'attente';
}

function Jeton({ patient, etat }) {
  const incident = alertes(patient).some((a) => a.ton === 'ruby');
  const style = {
    fait: incident
      ? 'border-rose-400/50 bg-rose-50/70 text-rose-700'
      : 'border-emerald-400/50 bg-emerald-50/70 text-emerald-700',
    encours: 'border-magenta/35 bg-magenta/[0.08] text-magenta',
    attente: 'border-navy/[0.07] bg-white/50 text-slate-500',
  }[etat];

  return (
    <Link
      to={`?dossier=${patient.id}`}
      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition-all hover:brightness-95 ${style}`}
    >
      {etat === 'fait' ? (
        incident ? <AlertTriangle size={12} className="shrink-0" /> : <Check size={12} strokeWidth={3} className="shrink-0" />
      ) : etat === 'encours' ? (
        <Send size={12} className="shrink-0" />
      ) : (
        <Clock size={12} className="shrink-0" />
      )}
      <span className="truncate font-medium">
        {patient.nom} {patient.prenom[0]}.
      </span>
    </Link>
  );
}

export default function Echeancier() {
  const { patients } = useDossiers();

  return (
    <>
      <EnTete
        titre="Échéancier SMS"
        question="Où en est chaque patient dans sa préparation, et quel message part ensuite."
      />

      <div className="px-5 pt-6 sm:px-8">
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {ETAPES.map((etape, i) => {
            const dedans = patients.filter((p) => statut(p, i) === 'encours');
            const faits = patients.filter((p) => statut(p, i) === 'fait');
            const attente = patients.filter((p) => statut(p, i) === 'attente');

            return (
              <section
                key={etape.id}
                className="rounded-2xl border border-navy/[0.07] bg-white/60 p-4 backdrop-blur-2xl"
              >
                <div className="flex items-baseline justify-between gap-2 border-b border-navy/[0.07] pb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-navy">{etape.cle}</p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-600">{etape.titre}</p>
                  </div>
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {etape.heure}
                  </span>
                </div>

                <p className="mt-3 text-[11px] italic leading-relaxed text-slate-600">
                  « {etape.sms.replace('{date}', 'jour J').slice(0, 95)}… »
                </p>

                <div className="mt-4 space-y-3">
                  {dedans.length ? (
                    <div>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-magenta">
                        En cours · {dedans.length}
                      </p>
                      <div className="space-y-1.5">
                        {dedans.map((p) => <Jeton key={p.id} patient={p} etat="encours" />)}
                      </div>
                    </div>
                  ) : null}

                  {faits.length ? (
                    <div>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Validé · {faits.length}
                      </p>
                      <div className="space-y-1.5">
                        {faits.map((p) => <Jeton key={p.id} patient={p} etat="fait" />)}
                      </div>
                    </div>
                  ) : null}

                  {attente.length ? (
                    <div>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Pas encore échu · {attente.length}
                      </p>
                      <div className="space-y-1.5">
                        {attente.map((p) => <Jeton key={p.id} patient={p} etat="attente" />)}
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>

        <p className="mt-6 text-[11px] leading-relaxed text-slate-500">
          Un dossier validé mais porteur d’une alerte rouge reste marqué en rouge : l’étape est close,
          le risque ne l’est pas.
        </p>
      </div>
    </>
  );
}
