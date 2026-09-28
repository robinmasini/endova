import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, PhoneCall, ExternalLink, AlertTriangle, IdCard, Activity, MessageSquare, History, ChevronRight,
} from '../../components/icones.js';
import { AnneauScore, TONS } from '../../components/ui.jsx';
import { useDossiers } from '../../lib/store.js';
import { calculerScore, statutRisque, alertesActives } from '../../lib/score.js';
import { planSms } from '../../lib/sms.js';
import { age, examenDe, anesthesieDe, heure, jour, echeance, nomComplet } from '../../lib/patient.js';
import OngletDossier from './OngletDossier.jsx';
import OngletPreparation from './OngletPreparation.jsx';
import OngletSms from './OngletSms.jsx';
import OngletTracabilite from './OngletTracabilite.jsx';

/**
 * Quatre onglets, quatre questions, jamais mélangées :
 * qui est le patient, où en est sa préparation, qu'a-t-il reçu, que peut-on prouver.
 */
const ONGLETS = [
  { id: 'dossier', label: 'Dossier', icone: IdCard, composant: OngletDossier },
  { id: 'preparation', label: 'Préparation', icone: Activity, composant: OngletPreparation },
  { id: 'sms', label: 'SMS', icone: MessageSquare, composant: OngletSms },
  { id: 'tracabilite', label: 'Traçabilité', icone: History, composant: OngletTracabilite },
];

export default function FichePage() {
  const { id } = useParams();
  const { patients, cabinet } = useDossiers();
  const [params, setParams] = useSearchParams();
  const patient = patients.find((p) => p.id === id);

  if (!patient) {
    return (
      <div className="px-5 pt-16 text-center sm:px-8">
        <p className="text-sm text-slate-700">Ce dossier n’existe pas ou a été archivé.</p>
        <Link to="/patients" className="mt-3 inline-block text-xs font-medium text-magenta hover:underline">
          Retour à la liste des patients
        </Link>
      </div>
    );
  }

  const onglet = ONGLETS.find((o) => o.id === params.get('onglet')) ?? ONGLETS[0];
  const choisir = (o) => setParams(o === 'dossier' ? {} : { onglet: o }, { replace: true });

  const { total } = calculerScore(patient);
  const statut = statutRisque(patient);
  const actives = alertesActives(patient);
  const critiques = actives.filter((a) => a.ton === 'ruby');
  const nonLus = planSms(patient, cabinet).filter((s) => s.statut === 'envoye' || s.statut === 'a_envoyer').length;
  const ex = examenDe(patient);
  const Contenu = onglet.composant;

  const compteurs = { preparation: actives.length, sms: nonLus };

  return (
    <div className="pb-10">
      {/* En-tête collant : l'identité et l'examen restent sous les yeux, quel que soit l'onglet. */}
      <header className="sticky top-0 z-20 border-b border-navy/[0.07] bg-white/80 backdrop-blur-2xl backdrop-saturate-[180%] print:static print:bg-white">
        <div className="px-5 pt-[calc(env(safe-area-inset-top,0px)+1rem)] sm:px-8">
          <Link
            to="/patients"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 transition-colors hover:text-navy print:hidden"
          >
            <ArrowLeft size={13} /> Patients
          </Link>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
            <AnneauScore valeur={total} ton={statut.ton} taille={56} epaisseur={5}>
              <span className="text-base font-extrabold text-navy">{total}</span>
            </AnneauScore>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-navy">{nomComplet(patient)}</h1>
                <span className="text-sm text-slate-500">{age(patient)} ans</span>
                <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${TONS[statut.ton].bord} ${TONS[statut.ton].fond} ${TONS[statut.ton].texte}`}>
                  {statut.court}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                <span className="font-medium text-navy">{ex.label}</span>
                {' · '}
                {jour(patient.examen.date)} à {heure(patient.examen.date)}
                <span className="text-slate-400"> ({echeance(patient)})</span>
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {patient.examen.lieu} · {patient.examen.operateur} · {anesthesieDe(patient).label} · n° {patient.numero}
              </p>
            </div>

            <div className="flex w-full shrink-0 gap-2 sm:w-auto print:hidden">
              <a
                href={`tel:${patient.identite.telephone}`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-magenta/35 bg-magenta/[0.08] px-3.5 py-2.5 text-xs font-semibold text-magenta transition-all hover:brightness-95 sm:flex-none"
              >
                <PhoneCall size={14} /> Appeler
              </a>
              <Link
                to={`/p/${patient.token}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-navy/[0.09] bg-white/70 px-3.5 py-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-white sm:flex-none"
              >
                <ExternalLink size={14} /> Espace patient
              </Link>
            </div>
          </div>

          {critiques.length ? (
            <button
              type="button"
              onClick={() => choisir('preparation')}
              className="mt-3 flex w-full items-center gap-2 rounded-xl border border-rose-400/50 bg-rose-50/80 px-3.5 py-2.5 text-left text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50 print:hidden"
            >
              <AlertTriangle size={14} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate">
                {critiques[0].titre}
                {critiques.length > 1 ? ` · et ${critiques.length - 1} autre${critiques.length > 2 ? 's' : ''}` : ''}
              </span>
              <ChevronRight size={14} className="shrink-0" />
            </button>
          ) : null}

          <nav className="-mb-px mt-4 flex gap-1 overflow-x-auto [scrollbar-width:none] print:hidden" aria-label="Sections du dossier">
            {ONGLETS.map((o) => {
              const actif = o.id === onglet.id;
              const n = compteurs[o.id];
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => choisir(o.id)}
                  aria-current={actif ? 'page' : undefined}
                  className={`flex shrink-0 items-center gap-2 border-b-2 px-3.5 pb-3 pt-1 text-sm transition-colors ${
                    actif ? 'border-magenta font-semibold text-magenta' : 'border-transparent font-medium text-slate-600 hover:text-navy'
                  }`}
                >
                  <o.icone size={15} />
                  {o.label}
                  {n ? (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white ${o.id === 'sms' ? 'bg-amber-500' : 'bg-rose-500'}`}>
                      {n}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <div key={onglet.id} className="rise px-5 pt-6 sm:px-8">
        <Contenu patient={patient} cabinet={cabinet} allerA={choisir} />
      </div>
    </div>
  );
}
