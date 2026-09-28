import { NavLink, Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { LayoutDashboard, UsersRound, CalendarClock, Settings, RotateCcw, PhoneCall, CalendarDays, Plus } from '../components/icones.js';
import { useDossiers, store } from '../lib/store.js';
import { alertesActives } from '../lib/score.js';
import ScanSms from '../components/ScanSms.jsx';
import { joursAvant } from '../lib/examens.js';

/**
 * Chaque entrée répond à une question distincte, et à une seule.
 * C'est ce qui évite de réempiler quatre sujets sur un même écran.
 */
const GROUPES = [
  {
    titre: 'Suivi',
    sections: [
      { to: '/', fin: true, label: 'Accueil', complet: 'Tableau de bord', icone: LayoutDashboard, mobile: 0 },
      { to: '/rappels', label: 'Rappels', complet: 'À rappeler', icone: PhoneCall, compteur: 'rappels', mobile: 1 },
      { to: '/vacations', label: 'Vacations', complet: 'Vacations', icone: CalendarDays },
    ],
  },
  {
    titre: 'Dossiers',
    sections: [
      { to: '/patients', label: 'Patients', complet: 'Patients', icone: UsersRound, mobile: 2 },
      { to: '/patients/nouveau', label: 'Nouveau', complet: 'Nouveau dossier', icone: Plus, fin: true },
    ],
  },
  {
    titre: 'Communication',
    sections: [{ to: '/echeancier', label: 'SMS', complet: 'Échéancier SMS', icone: CalendarClock, mobile: 3 }],
  },
  {
    titre: 'Cabinet',
    sections: [{ to: '/reglages', label: 'Réglages', complet: 'Réglages', icone: Settings }],
  },
];

// La barre mobile n'a que quatre places autour du bouton de scan SMS : les
// vacations et les réglages restent accessibles depuis le tableau de bord.
const MOBILE = GROUPES.flatMap((g) => g.sections).filter((s) => s.mobile !== undefined).sort((a, b) => a.mobile - b.mobile);

function Pastille({ n }) {
  if (!n) return null;
  return (
    <span className="ml-auto flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
      {n}
    </span>
  );
}

function Onglet({ section: { to, fin, label, icone: Icone, compteur }, compteurs }) {
  return (
    <NavLink
      to={to}
      end={fin}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] transition-colors ${
          isActive ? 'font-semibold text-magenta' : 'font-medium text-slate-600'
        }`
      }
    >
      <span className="relative">
        <Icone size={19} />
        {compteurs[compteur] ? (
          <span className="absolute -right-2 -top-1.5 flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
            {compteurs[compteur]}
          </span>
        ) : null}
      </span>
      {label}
    </NavLink>
  );
}

export default function Coquille() {
  const { patients, cabinet } = useDossiers();
  const [params] = useSearchParams();

  // Anciens liens « ?dossier= » : la fiche est désormais une page à part entière.
  const ancien = params.get('dossier');
  if (ancien) return <Navigate to={`/patients/${ancien}`} replace />;

  const compteurs = {
    rappels: patients.filter((p) => joursAvant(p) >= 0 && alertesActives(p).length).length,
  };

  return (
    <div className="min-h-dvh md:pl-60 print:pl-0">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 print:!hidden flex-col border-r border-navy/[0.07] bg-white/60 backdrop-blur-2xl backdrop-saturate-[180%] md:flex">
        {/* Bloc de marque centré, à l'inverse des entrées de nav calées à gauche.
            Le mot-symbole est distribué sur la largeur exacte du pictogramme :
            le E et le A tombent sur ses bords, quelle que soit la taille. */}
        <div className="flex flex-col items-center px-5 pb-7 pt-[calc(env(safe-area-inset-top,0px)+1.75rem)]">
          <span className="brillance relative block overflow-hidden rounded-[1.75rem]">
            <img src={`${import.meta.env.BASE_URL}endova-mark.png`} alt="" className="size-28 rounded-[1.75rem]" />
          </span>
          <p
            aria-label="Endova"
            className="mt-3.5 flex w-28 justify-between font-marque text-[14px] font-semibold text-navy"
          >
            {[...'ENDOVA'].map((lettre, i) => (
              <span key={`${lettre}-${i}`} aria-hidden="true">{lettre}</span>
            ))}
          </p>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3">
          {GROUPES.map((g) => (
            <div key={g.titre}>
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{g.titre}</p>
              <div className="space-y-0.5">
                {g.sections.map(({ to, fin, complet, icone: Icone, compteur }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={fin}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-magenta/[0.09] font-semibold text-magenta'
                          : 'font-medium text-slate-700 hover:bg-navy/[0.04] hover:text-navy'
                      }`
                    }
                  >
                    <Icone size={16} className="shrink-0" />
                    {complet}
                    <Pastille n={compteurs[compteur]} />
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-navy/[0.07] p-3">
          <p className="px-2 pb-2 text-[11px] leading-relaxed text-slate-500">
            <span className="block font-semibold text-slate-700">{cabinet.nomCourt}</span>
            {patients.length} dossiers en préparation
          </p>
          <button
            type="button"
            onClick={() => store.reinitialiser()}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-slate-600 transition-colors hover:bg-navy/[0.04] hover:text-navy"
          >
            <RotateCcw size={13} /> Réinitialiser la démo
          </button>
        </div>
      </aside>

      {/* Contenu — la marge basse laisse passer la barre mobile */}
      <main className="pb-24 md:pb-28">
        <Outlet />
      </main>

      {/* Scan SMS — bureau : même bouton, posé en bas à droite, toujours à portée. */}
      <ScanSms bureau />

      {/* Barre de navigation — mobile. La marque occupe le centre, en pastille
          surélevée : quatre sections se répartissent de part et d'autre. */}
      <nav className="fixed inset-x-0 bottom-0 z-30 print:hidden border-t border-navy/[0.07] bg-white/85 backdrop-blur-2xl backdrop-saturate-[180%] md:hidden">
        <div className="flex items-stretch pb-[env(safe-area-inset-bottom,0px)]">
          {MOBILE.slice(0, 2).map((s) => <Onglet key={s.to} section={s} compteurs={compteurs} />)}

          <div className="relative w-20 shrink-0">
            {/* Le glyphe Endova est le bouton de scan SMS : il délivre tout ce qui est échu. */}
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-6">
              <ScanSms />
            </div>
          </div>

          {MOBILE.slice(2).map((s) => <Onglet key={s.to} section={s} compteurs={compteurs} />)}
        </div>
      </nav>

    </div>
  );
}

/** En-tête commun aux sections : titre, question à laquelle l'écran répond. */
export function EnTete({ titre, question, children }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-navy/[0.07] px-5 pb-5 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] sm:px-8">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-navy">{titre}</h1>
        <p className="mt-1 text-sm text-slate-600">{question}</p>
      </div>
      {children}
    </header>
  );
}
