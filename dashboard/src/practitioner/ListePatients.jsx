import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ChevronRight, Check, Plus } from '../components/icones.js';
import { useDossiers } from '../lib/store.js';
import { calculerScore, statutRisque, alertesActives } from '../lib/score.js';
import { EXAMENS, etapesDe, joursAvant } from '../lib/examens.js';
import { age, examenDe, heure, jourCourt, echeance, nomComplet } from '../lib/patient.js';
import { TONS } from '../components/ui.jsx';
import { EnTete } from './Coquille.jsx';
import Jalon from '../components/Jalon.jsx';
import TiroirPatient from '../components/TiroirPatient.jsx';
import { retoursPatient, TON_PASTILLE } from '../lib/retours.js';

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

function Rangee({ patient, actif, onOuvrir }) {
  const { total } = calculerScore(patient);
  const statut = statutRisque(patient);
  const { faites, total: nbEtapes, courante, etapes } = avancement(patient);
  const retours = retoursPatient(patient);
  // Un seul signal par patient dans la liste : le plus important. Le détail est dans le dossier.
  const principal = retours[0];

  return (
    <button
      type="button"
      onClick={() => onOuvrir(patient.id)}
      aria-pressed={actif}
      className={`group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border bg-white p-5 text-left shadow-[0_6px_18px_-12px_rgba(5,28,78,0.25)] transition-all duration-200 hover:shadow-[0_10px_26px_-12px_rgba(5,28,78,0.35)] sm:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_auto_auto] ${
        actif ? 'border-navy ring-2 ring-navy/20' : statut.ton === 'ruby' ? 'border-rose-300' : 'border-navy/[0.08]'
      }`}
    >
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-2 text-lg font-bold leading-snug text-navy">
          {nomComplet(patient)}
          <span className="text-base font-normal text-slate-500">{age(patient)} ans</span>
        </p>
        <p className="mt-1 text-[15px] text-slate-700">
          {examenDe(patient).label} · {jourCourt(patient.examen.date)} à {heure(patient.examen.date)}
        </p>
        <p className="text-[15px] font-medium text-slate-500">{echeance(patient)}</p>
        {principal ? (
          <p className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-lg border px-3 py-1.5 text-[14px] font-semibold ${TON_PASTILLE[principal.ton] ?? TON_PASTILLE.neutre}`}>
              {principal.texte}
            </span>
            {retours.length > 1 ? (
              <span className="text-[14px] font-medium text-slate-500">
                + {retours.length - 1} autre{retours.length > 2 ? 's' : ''}
              </span>
            ) : null}
          </p>
        ) : null}
      </div>

      <div className="hidden min-w-0 sm:block">
        <p className="flex items-center gap-2 text-[15px] text-slate-700">
          {courante ? (
            <>
              <Jalon taille="s">{courante.cle(patient)}</Jalon>
              <span className="truncate">{courante.titre}</span>
            </>
          ) : (
            <><Check size={16} strokeWidth={3} className="shrink-0 text-emerald-700" /> Préparation terminée</>
          )}
        </p>
        <div className="mt-2.5 flex gap-1.5">
          {etapes.map((e, i) => (
            <span key={e.id} className={`h-2 flex-1 rounded-full ${i < faites ? TONS[statut.ton].trait : 'bg-navy/[0.09]'}`} />
          ))}
        </div>
        <p className="mt-1.5 text-[13px] text-slate-500">{faites}/{nbEtapes} étapes</p>
      </div>

      <div className="shrink-0 text-right">
        <p className={`text-3xl font-extrabold leading-none tabular-nums ${TONS[statut.ton].texte}`}>{total}</p>
        <p className={`mt-1.5 text-[13px] font-semibold ${TONS[statut.ton].texte}`}>{statut.court}</p>
      </div>
      <ChevronRight size={20} className="hidden shrink-0 text-slate-400 transition-colors group-hover:text-navy sm:block" />
    </button>
  );
}

export default function ListePatients() {
  const { patients } = useDossiers();
  const [q, setQ] = useState('');
  // On retient l'identifiant, pas le dossier : il doit rester frais après
  // chaque écriture du store.
  const [ouvert, setOuvert] = useState(null);
  const selection = patients.find((p) => p.id === ouvert) ?? null;
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
          className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-navy px-5 py-3 text-[15px] font-semibold text-white shadow-[0_8px_20px_-10px_rgba(147,43,156,0.7)] transition-all hover:brightness-110"
        >
          <Plus size={18} /> Nouveau dossier
        </Link>
      </EnTete>

      <div className="px-5 pt-6 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un patient"
              aria-label="Rechercher un patient"
              className="w-full rounded-2xl border border-navy/[0.1] bg-white py-4 pl-12 pr-4 text-base text-navy outline-none transition-colors placeholder:text-slate-500 focus:border-navy/50"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTRES.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltre(f.id)}
                className={`min-h-11 shrink-0 rounded-full border px-5 py-2.5 text-[15px] font-semibold transition-colors ${
                  filtre === f.id
                    ? 'border-navy bg-navy text-white'
                    : 'border-navy/[0.12] bg-white text-slate-700 hover:text-navy'
                }`}
              >
                {f.label} <span className="tabular-nums opacity-70">{compte[f.id]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 hidden gap-2 overflow-x-auto sm:flex">
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

        <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_23rem]">
          <div className="space-y-3.5">
            {resultats.length === 0 ? (
              <div className="rounded-xl border border-navy/[0.07] bg-white/60 p-8 text-center">
                <p className="text-sm text-slate-700">Aucun dossier ne correspond</p>
                <p className="mt-1.5 text-xs text-slate-500">Modifiez la recherche ou le filtre.</p>
              </div>
            ) : (
              resultats.map((p) => (
                <Rangee key={p.id} patient={p} actif={p.id === ouvert} onOuvrir={setOuvert} />
              ))
            )}
          </div>

          {/* En grand écran le tiroir occupe sa colonne ; en dessous il passe
              par-dessus la liste, qui n'a plus la place de l'accueillir. */}
          {selection ? (
            <>
              <div
                onClick={() => setOuvert(null)}
                aria-hidden="true"
                className="fixed inset-0 z-40 bg-navy/25 backdrop-blur-sm xl:hidden"
              />
              <div className="fixed inset-x-4 bottom-4 top-4 z-50 xl:sticky xl:inset-auto xl:top-6 xl:z-auto xl:self-start">
                <TiroirPatient patient={selection} onFermer={() => setOuvert(null)} />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
