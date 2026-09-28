import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, AlertTriangle, ChevronRight, CalendarDays } from '../components/icones.js';
import { useDossiers } from '../lib/store.js';
import { joursAvant } from '../lib/examens.js';
import { calculerScore, statutRisque, alertesActives } from '../lib/score.js';
import { examenDe, anesthesieDe, heure, jour, nomComplet, echeance } from '../lib/patient.js';
import { TONS } from '../components/ui.jsx';
import { EnTete } from './Coquille.jsx';

/**
 * Le planning tel que le pense un gastro-entérologue : une vacation = un jour,
 * un lieu, un opérateur. On y lit d'un coup d'œil combien de patients sont prêts.
 */
function Vacation({ date, lieu, operateur, patients }) {
  const prets = patients.filter((p) => statutRisque(p).court === 'Prêt').length;
  const risque = patients.filter((p) => statutRisque(p).ton === 'ruby').length;

  return (
    <section className="rounded-2xl border border-white/80 bg-white/70 p-5 shadow-[0_10px_28px_-12px_rgba(5,28,78,0.14)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-navy/[0.07] pb-4">
        <div className="min-w-0">
          <p className="text-base font-bold capitalize text-navy">{jour(date)} <span className="text-sm font-normal normal-case text-slate-500">· {echeance({ examen: { date } })}</span></p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600"><MapPin size={12} /> {lieu} · {operateur}</p>
        </div>
        <div className="flex shrink-0 gap-2 text-[11px] font-semibold">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{prets}/{patients.length} prêt{prets > 1 ? 's' : ''}</span>
          {risque ? <span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">{risque} en péril</span> : null}
        </div>
      </div>
      <ol className="mt-3 space-y-2">
        {patients.map((p, i) => {
          const statut = statutRisque(p);
          const nb = alertesActives(p).length;
          return (
            <li key={p.id}>
              <Link to={`/patients/${p.id}`} className="group flex items-center gap-3 rounded-xl border border-navy/[0.06] bg-white/60 p-3 transition-colors hover:bg-white">
                <span className="w-6 shrink-0 text-center text-xs font-bold text-slate-400">{i + 1}</span>
                <span className="w-12 shrink-0 text-sm font-bold tabular-nums text-navy">{heure(p.examen.date)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-navy">{nomComplet(p)}</span>
                  <span className="block truncate text-[11px] text-slate-500">{examenDe(p).label} · {anesthesieDe(p).court} · {p.examen.indication}</span>
                </span>
                {nb ? <span className={`hidden items-center gap-1 text-[11px] font-semibold sm:inline-flex ${TONS[statut.ton === 'ruby' ? 'ruby' : 'amber'].texte}`}><AlertTriangle size={11} /> {nb}</span> : null}
                <span className={`w-16 shrink-0 text-right text-[11px] font-semibold ${TONS[statut.ton].texte}`}>{statut.court}</span>
                <span className={`w-8 shrink-0 text-right text-sm font-bold tabular-nums ${TONS[statut.ton].texte}`}>{calculerScore(p).total}</span>
                <ChevronRight size={14} className="shrink-0 text-slate-400 group-hover:text-navy" />
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default function Vacations() {
  const { patients, cabinet } = useDossiers();
  const [praticien, setPraticien] = useState('tous');

  const aVenir = patients
    .filter((p) => joursAvant(p) >= 0 && (praticien === 'tous' || p.examen.operateur === praticien))
    .sort((a, b) => new Date(a.examen.date) - new Date(b.examen.date));

  // Une vacation = même jour, même lieu, même opérateur.
  const vacations = [];
  for (const p of aVenir) {
    const cle = `${new Date(p.examen.date).toDateString()}|${p.examen.lieu}|${p.examen.operateur}`;
    let v = vacations.find((x) => x.cle === cle);
    if (!v) vacations.push((v = { cle, date: p.examen.date, lieu: p.examen.lieu, operateur: p.examen.operateur, patients: [] }));
    v.patients.push(p);
  }

  return (
    <>
      <EnTete titre="Vacations" question="Les prochaines demi-journées d’endoscopie, lieu par lieu, et qui y est prêt." />
      <div className="px-5 pt-6 sm:px-8">
        <div className="mb-5 flex gap-2 overflow-x-auto">
          {['tous', ...cabinet.praticiens].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPraticien(p)}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
                praticien === p ? 'border-magenta/40 bg-magenta/[0.1] text-magenta' : 'border-navy/[0.09] bg-white/60 text-slate-600 hover:text-navy'
              }`}
            >
              {p === 'tous' ? 'Tous les praticiens' : p}
            </button>
          ))}
        </div>
        {vacations.length ? (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-2">
            {vacations.map((v) => <Vacation key={v.cle} {...v} />)}
          </div>
        ) : (
          <p className="flex items-center gap-2 rounded-xl border border-navy/[0.07] bg-white/60 p-5 text-sm text-slate-600"><CalendarDays size={15} /> Aucune vacation programmée.</p>
        )}
      </div>
    </>
  );
}
