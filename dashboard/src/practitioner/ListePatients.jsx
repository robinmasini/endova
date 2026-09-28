import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, AlertTriangle, ChevronRight, Check, Clock, Plus } from '../components/icones.js';
import { useDossiers } from '../lib/store.js';
import { calculerScore, statutRisque, alertesActives } from '../lib/score.js';
import { EXAMENS, etapesDe, joursAvant } from '../lib/examens.js';
import { age, examenDe, heure, jourCourt, echeance, nomComplet } from '../lib/patient.js';
import { TONS } from '../components/ui.jsx';
import { EnTete } from './Coquille.jsx';

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const FILTRES = [
  { id: 'tous', label: 'Tous' },
  { id: 'alerte', label: 'En alerte' },
  { id: 'encours', label: 'En cours' },
  { id: 'termine', label: 'Terminés' },
];

/** Avancement dans l'échéancier, en nombre d'étapes closes. */
function avancement(patient) {
  const etapes = etapesDe(patient);
  const faites = etapes.filter((e) => patient.etapes[e.id]?.done).length;
  const courante = etapes.find((e) => !patient.etapes[e.id]?.done);
  return { faites, total: etapes.length, courante, etapes };
}

function Rangee({ patient }) {
  const { total } = calculerScore(patient);
  const statut = statutRisque(patient);
  const nb = alertesActives(patient).length;
  const { faites, total: nbEtapes, courante, etapes } = avancement(patient);

  return (
    <Link
      to={`/patients/${patient.id}`}
      className={`group grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border p-4 transition-all duration-200 hover:bg-white/85 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_auto_auto] ${
        nb ? 'border-rose-400/35 bg-rose-50/50' : 'border-navy/[0.07] bg-white/60'
      }`}
    >
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-navy">
          {nomComplet(patient)}
          <span className="font-normal text-slate-500">{age(patient)} ans</span>
          {nb ? (
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${TONS[statut.ton].texte}`}>
              <AlertTriangle size={11} /> {nb}
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-600">
          {examenDe(patient).label} · {jourCourt(patient.examen.date)} à {heure(patient.examen.date)}
          <span className="text-slate-400"> ({echeance(patient)})</span>
        </p>
      </div>

      <div className="hidden min-w-0 sm:block">
        <p className="flex items-center gap-1.5 text-xs text-slate-600">
          {courante ? <Clock size={12} className="shrink-0 text-magenta" /> : <Check size={12} strokeWidth={3} className="shrink-0 text-emerald-700" />}
          <span className="truncate">{courante ? `${courante.cle(patient)} — ${courante.titre}` : 'Préparation terminée'}</span>
        </p>
        <div className="mt-1.5 flex gap-1">
          {etapes.map((e, i) => (
            <span
              key={e.id}
              className={`h-1.5 flex-1 rounded-full ${i < faites ? TONS[statut.ton].trait : 'bg-navy/[0.09]'}`}
            />
          ))}
        </div>
        <p className="mt-1 text-[10px] text-slate-500">
          {faites}/{nbEtapes} étapes · {patient.examen.operateur}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className={`text-lg font-bold tabular-nums ${TONS[statut.ton].texte}`}>{total}</p>
        <p className="text-[10px] uppercase tracking-wider text-slate-500">{statut.court}</p>
      </div>
      <ChevronRight size={16} className="hidden shrink-0 text-slate-400 transition-colors group-hover:text-navy sm:block" />
    </Link>
  );
}

export default function ListePatients() {
  const { patients } = useDossiers();
  const [q, setQ] = useState('');
  // Le filtre vit dans l'URL : le Dashboard peut pointer directement sur « En alerte ».
  const [params, setParams] = useSearchParams();
  const filtre = FILTRES.some((f) => f.id === params.get('filtre')) ? params.get('filtre') : 'tous';
  const setFiltre = (id) => {
    const suite = new URLSearchParams(params);
    if (id === 'tous') suite.delete('filtre');
    else suite.set('filtre', id);
    setParams(suite, { replace: true });
  };

  const [type, setType] = useState('tous');
  const resultats = useMemo(() => {
    const requete = norm(q.trim());
    return patients
      .filter((p) => {
        const { courante } = avancement(p);
        if (type !== 'tous' && p.examen.type !== type) return false;
        if (filtre === 'alerte' && !alertesActives(p).length) return false;
        if (filtre === 'encours' && !courante) return false;
        if (filtre === 'termine' && courante) return false;
        if (!requete) return true;
        return norm(`${p.identite.nom} ${p.identite.prenom} ${examenDe(p).label} ${p.examen.indication} ${p.numero}`).includes(requete);
      })
      .sort((a, b) => joursAvant(a) - joursAvant(b) || new Date(a.examen.date) - new Date(b.examen.date));
  }, [patients, q, filtre, type]);

  const compte = {
    tous: patients.length,
    alerte: patients.filter((p) => alertesActives(p).length).length,
    encours: patients.filter((p) => avancement(p).courante).length,
    termine: patients.filter((p) => !avancement(p).courante).length,
  };

  return (
    <>
      <EnTete titre="Patients" question={`${patients.length} dossiers, classés par date d’examen.`}>
        <Link
          to="/patients/nouveau"
          className="inline-flex items-center gap-2 rounded-xl bg-magenta px-4 py-2.5 text-xs font-semibold text-white shadow-[0_8px_20px_-10px_rgba(147,43,156,0.7)] transition-all hover:brightness-110"
        >
          <Plus size={14} /> Nouveau dossier
        </Link>
      </EnTete>

      <div className="px-5 pt-6 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nom, examen, indication, n° de dossier…"
              aria-label="Rechercher un patient"
              className="w-full rounded-xl border border-navy/[0.09] bg-white/70 py-3 pl-10 pr-4 text-sm text-navy outline-none transition-colors placeholder:text-slate-500 focus:border-magenta/50"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {FILTRES.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltre(f.id)}
                className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
                  filtre === f.id
                    ? 'border-magenta/40 bg-magenta/[0.1] text-magenta'
                    : 'border-navy/[0.09] bg-white/60 text-slate-600 hover:text-navy'
                }`}
              >
                {f.label} <span className="tabular-nums opacity-70">{compte[f.id]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto">
          {[['tous', 'Tous examens'], ...Object.values(EXAMENS).map((e) => [e.id, e.label])].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setType(id)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                type === id ? 'bg-navy text-white' : 'bg-white/60 text-slate-600 hover:text-navy'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-2.5">
          {resultats.length === 0 ? (
            <div className="rounded-xl border border-navy/[0.07] bg-white/60 p-8 text-center">
              <p className="text-sm text-slate-700">Aucun dossier ne correspond</p>
              <p className="mt-1.5 text-xs text-slate-500">Modifiez la recherche ou le filtre.</p>
            </div>
          ) : (
            resultats.map((p) => <Rangee key={p.id} patient={p} />)
          )}
        </div>
      </div>
    </>
  );
}
