import { useState } from 'react';
import {
  AlertTriangle, CheckCircle2, XCircle, Circle, RefreshCw, ArrowDownWideNarrow, CalendarX, Syringe, Undo2, ListChecks,
} from '../../components/icones.js';
import SchemaDigestif from '../../components/SchemaDigestif.jsx';
import { AnneauScore, TONS } from '../../components/ui.jsx';
import { store } from '../../lib/store.js';
import { calculerScore, statutRisque, alertes } from '../../lib/score.js';
import { etapesDe } from '../../lib/examens.js';
import { resume, lignes } from '../../lib/declarations.js';
import { examenDe, horodatage } from '../../lib/patient.js';
import { Carte, Pastille, BoutonDiscret } from './elements.jsx';

const ICONE = { emerald: CheckCircle2, amber: AlertTriangle, ruby: XCircle, neutre: Circle, marque: Circle };
const SOURCE = { patient: 'Déclaré par le patient', dossier: 'Terrain du dossier', cabinet: 'Suivi du cabinet', sms: 'Suivi SMS' };

function Alerte({ patient, alerte }) {
  const [note, setNote] = useState('');
  const [ouvert, setOuvert] = useState(false);
  const t = alerte.traitee;

  return (
    <article className={`rounded-xl border p-4 ${t ? 'border-navy/[0.08] bg-white/55' : `${TONS[alerte.ton].bord} ${TONS[alerte.ton].fond}`}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className={`flex items-center gap-2 text-sm font-semibold ${t ? 'text-slate-500 line-through decoration-slate-400/60' : TONS[alerte.ton].texte}`}>
          <AlertTriangle size={15} className="shrink-0" /> {alerte.titre}
        </p>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{SOURCE[alerte.source]}</span>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-700">{alerte.detail}</p>
      <p className="mt-2 text-xs font-medium text-navy">Conduite à tenir : <span className="font-normal text-slate-700">{alerte.action}</span></p>

      {t ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-50/70 px-3 py-2">
          <p className="text-[11px] text-emerald-800">
            Traitée par {t.auteur} le {horodatage(t.at)}{t.note ? ` — ${t.note}` : ''}
          </p>
          <button type="button" onClick={() => store.rouvrirAlerte(patient.id, alerte)} className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-navy">
            <Undo2 size={12} /> Rouvrir
          </button>
        </div>
      ) : ouvert ? (
        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            store.traiterAlerte(patient.id, alerte, note.trim());
          }}
        >
          <input
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ce qui a été fait (facultatif)"
            className="min-w-0 flex-1 rounded-lg border border-navy/[0.1] bg-white px-3 py-2 text-xs text-navy outline-none focus:border-magenta/50"
          />
          <button type="submit" className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
            Marquer comme traitée
          </button>
        </form>
      ) : (
        <BoutonDiscret className="mt-3" onClick={() => setOuvert(true)}>
          <CheckCircle2 size={13} /> Traiter l’alerte
        </BoutonDiscret>
      )}
    </article>
  );
}

const ACTIONS = [
  { id: 'lavement', label: 'Prescrire un lavement de secours', icone: RefreshCw, purge: true, detail: 'Lavement à l’arrivée sur le plateau technique' },
  { id: 'decaler', label: 'Décaler en fin de vacation', icone: ArrowDownWideNarrow, detail: 'Deux heures de plus pour laisser agir la préparation' },
  { id: 'anesthesiste', label: 'Prévenir l’anesthésiste', icone: Syringe, detail: 'Information transmise avant l’induction' },
  { id: 'reporter', label: 'Reporter l’examen', icone: CalendarX, detail: 'Nouveau rendez-vous à fixer avec le patient' },
];

function ActionsCorrectives({ patient }) {
  const [fait, setFait] = useState(null);
  const liste = ACTIONS.filter((a) => !a.purge || examenDe(patient).purge);

  function tracer(a) {
    store.journaliser(patient.id, { type: 'action', titre: a.label, detail: a.detail });
    setFait(a.id);
  }

  return (
    <Carte titre="Actions correctives" icone={<ListChecks size={14} />} note="Chaque action est tracée et horodatée dans la traçabilité du dossier.">
      <div className="grid gap-2 sm:grid-cols-2">
        {liste.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => tracer(a)}
            className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left text-sm font-medium transition-colors ${
              fait === a.id ? 'border-emerald-400/50 bg-emerald-50/70 text-emerald-700' : 'border-navy/[0.09] bg-white/60 text-slate-700 hover:bg-white hover:text-navy'
            }`}
          >
            {fait === a.id ? <CheckCircle2 size={16} className="shrink-0" /> : <a.icone size={16} className="shrink-0 text-slate-500" />}
            {fait === a.id ? 'Tracé dans le dossier' : a.label}
          </button>
        ))}
      </div>
    </Carte>
  );
}

export default function OngletPreparation({ patient }) {
  const { total, detail, acquisPossible, poids } = calculerScore(patient);
  const statut = statutRisque(patient);
  const liste = alertes(patient).sort((a, b) => Boolean(a.traitee) - Boolean(b.traitee));
  const etapes = etapesDe(patient);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5">
        <Carte titre="Index de préparation" icone={<CheckCircle2 size={14} />}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <AnneauScore valeur={total} ton={statut.ton} taille={92} epaisseur={8}>
                <span className="text-2xl font-extrabold text-navy">{total}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500">/ 100</span>
              </AnneauScore>
              <div>
                <p className={`text-base font-semibold ${TONS[statut.ton].texte}`}>{statut.label}</p>
                <p className="mt-1 text-xs text-slate-600">{total} points acquis sur {acquisPossible} échus</p>
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              {etapes.map((e) => (
                <div key={e.id} className="flex items-center gap-2.5">
                  <span className="w-9 shrink-0 text-[10px] font-bold uppercase text-slate-600">{e.cle(patient)}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy/[0.07]">
                    <span
                      className={`block h-full rounded-full transition-all duration-500 ${detail[e.id] === poids[e.id] ? 'bg-emerald-500' : detail[e.id] > 0 ? 'bg-amber-500' : 'bg-transparent'}`}
                      style={{ width: `${(detail[e.id] / poids[e.id]) * 100}%` }}
                    />
                  </span>
                  <span className="w-11 shrink-0 text-right text-[11px] tabular-nums text-slate-600">{detail[e.id]}/{poids[e.id]}</span>
                </div>
              ))}
            </div>
          </div>
        </Carte>

        <Carte titre={`Alertes (${liste.filter((a) => !a.traitee).length} active${liste.filter((a) => !a.traitee).length > 1 ? 's' : ''})`} icone={<AlertTriangle size={14} />}>
          {liste.length ? (
            <div className="space-y-2.5">
              {liste.map((a) => <Alerte key={a.code} patient={patient} alerte={a} />)}
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 size={15} /> Aucune alerte sur ce dossier.</p>
          )}
        </Carte>

        <Carte titre="Étapes de l’échéancier" icone={<ListChecks size={14} />}>
          <ol className="relative space-y-3">
            {etapes.map((e) => {
              const r = resume(patient, e.id);
              const Icone = ICONE[r.ton];
              const d = patient.etapes[e.id];
              const envoi = e.envoi(patient);
              return (
                <li key={e.id} className="rounded-xl border border-navy/[0.07] bg-white/60 p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Icone size={17} className={`shrink-0 ${TONS[r.ton].texte}`} />
                      <div className="min-w-0">
                        <p className="truncate text-sm text-navy">
                          <span className="font-bold">{e.cle(patient)}</span> — {e.titre}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {d?.at ? `Répondu le ${horodatage(d.at)}` : `${envoi > new Date() ? 'SMS prévu le' : 'SMS envoyé le'} ${horodatage(envoi)}`}
                        </p>
                      </div>
                    </div>
                    <Pastille ton={r.ton}>{r.texte}</Pastille>
                  </div>
                  {d?.done ? (
                    <dl className="mt-3 grid gap-1.5 border-t border-navy/[0.06] pt-3">
                      {lignes(patient, e.id).map(([k, v, ton]) => (
                        <div key={k} className="flex items-baseline justify-between gap-4 text-xs">
                          <dt className="text-slate-600">{k}</dt>
                          <dd className={`text-right font-medium ${TONS[ton].texte === 'text-slate-600' ? 'text-navy' : TONS[ton].texte}`}>{v}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </Carte>
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5">
        {examenDe(patient).purge ? (
          <Carte titre="Projection anatomique">
            <SchemaDigestif patient={patient} />
          </Carte>
        ) : null}
        <ActionsCorrectives patient={patient} />
      </div>
    </div>
  );
}
