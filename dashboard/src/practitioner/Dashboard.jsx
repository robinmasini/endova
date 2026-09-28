import { Link } from 'react-router-dom';
import {
  AlertTriangle, ChevronRight, ListChecks, PhoneCall, ShieldCheck, UsersRound, CalendarDays, Send, Plus, Banknote, Settings,
} from '../components/icones.js';
import { useDossiers } from '../lib/store.js';
import FileRappels, { fileDAppels } from './FileRappels.jsx';
import { calculerScore, statutRisque, alertesActives } from '../lib/score.js';
import { etapesDe, joursAvant } from '../lib/examens.js';
import { prochainsEnvois } from '../lib/sms.js';
import { examenDe, heure, jourCourt, nomComplet } from '../lib/patient.js';
import { TONS } from '../components/ui.jsx';
import { EnTete } from './Coquille.jsx';

/** Tuile flottante : elle se détache du fond, la valeur prime sur l'habillage. */
function Data({ libelle, valeur, unite, detail, ton = 'marque', icone }) {
  const t = TONS[ton];
  return (
    <div className="relative rounded-2xl border border-white/70 bg-white/70 p-5 backdrop-blur-2xl backdrop-saturate-[180%] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.95),0_2px_4px_0_rgba(5,28,78,0.04),0_16px_36px_-10px_rgba(5,28,78,0.14)] transition-transform duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">{libelle}</p>
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${t.fond} ${t.texte}`}>
          {icone}
        </span>
      </div>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span className={`text-3xl font-extrabold tracking-tight ${ton === 'marque' ? 'text-navy' : t.texte}`}>
          {valeur}
        </span>
        {unite ? <span className="text-xs font-medium text-slate-600">{unite}</span> : null}
      </p>
      <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">{detail}</p>
    </div>
  );
}

function Titre({ icone, children, action }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
        {icone} {children}
      </p>
      {action}
    </div>
  );
}

function Ligne({ patient, rang }) {
  const { total } = calculerScore(patient);
  const statut = statutRisque(patient);
  const nb = alertesActives(patient).length;
  const courante = etapesDe(patient).find((e) => !patient.etapes[e.id]?.done);

  return (
    <Link
      to={`/patients/${patient.id}`}
      className={`group flex items-center gap-3 rounded-xl border p-3.5 transition-all duration-200 hover:bg-white/85 ${
        statut.ton === 'ruby' ? 'border-rose-400/40 bg-rose-50/60' : 'border-navy/[0.07] bg-white/60'
      }`}
    >
      <span className="w-12 shrink-0 text-center text-sm font-bold tabular-nums text-navy">{rang ?? heure(patient.examen.date)}</span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-navy">{nomComplet(patient)}</span>
          {nb ? (
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${TONS[statut.ton === 'neutre' ? 'amber' : statut.ton].texte}`}>
              <AlertTriangle size={11} /> {nb}
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block truncate text-xs text-slate-600">
          {examenDe(patient).label} · {courante ? `prochaine étape ${courante.cle(patient)}` : 'préparation terminée'}
        </span>
      </span>
      <span className={`shrink-0 text-base font-bold tabular-nums ${TONS[statut.ton].texte}`}>{total}</span>
      <ChevronRight size={15} className="shrink-0 text-slate-400 transition-colors group-hover:text-navy" />
    </Link>
  );
}

export default function Dashboard() {
  const { patients, cabinet } = useDossiers();
  const aVenir = patients.filter((p) => joursAvant(p) >= 0);
  const file = fileDAppels(aVenir);

  const duJour = aVenir.filter((p) => joursAvant(p) === 0).sort((a, b) => new Date(a.examen.date) - new Date(b.examen.date));
  const semaine = aVenir.filter((p) => joursAvant(p) > 0 && joursAvant(p) <= 7).sort((a, b) => new Date(a.examen.date) - new Date(b.examen.date));
  const parJour = [];
  for (const p of semaine) {
    const cle = new Date(p.examen.date).toDateString();
    if (parJour.at(-1)?.cle !== cle) parJour.push({ cle, date: p.examen.date, patients: [] });
    parJour.at(-1).patients.push(p);
  }

  const enCours = aVenir.filter((p) => etapesDe(p).some((e) => !p.etapes[e.id]?.done)).length;
  const prets = duJour.filter((p) => statutRisque(p).court === 'Prêt').length;
  const envois = prochainsEnvois(aVenir, cabinet);

  // Conformité : points acquis rapportés aux points atteignables sur les étapes échues.
  const [acquis, atteignable] = aVenir.reduce(([a, m], p) => {
    const { total, acquisPossible } = calculerScore(p);
    return [a + total, m + acquisPossible];
  }, [0, 0]);
  const conformite = atteignable ? Math.round((acquis / atteignable) * 100) : null;

  // Reséquencement : dans la vacation du jour seulement, du mieux préparé au plus fragile.
  const conseille = [...duJour].sort((a, b) => calculerScore(b).total - calculerScore(a).total || new Date(a.examen.date) - new Date(b.examen.date));
  const aDeplacer = conseille.filter((p, i) => p.id !== duJour[i].id).length;
  const interceptes = aVenir.filter((p) => alertesActives(p).some((a) => a.ton === 'ruby')).length;

  return (
    <>
      <EnTete
        titre="Tableau de bord"
        question={`${cabinet.nomCourt} · ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`}
      >
        <Link to="/reglages" aria-label="Réglages" className="ml-auto rounded-xl border border-navy/[0.09] bg-white/70 p-2.5 text-slate-600 md:hidden">
          <Settings size={15} />
        </Link>
        <Link
          to="/patients/nouveau"
          className="inline-flex items-center gap-2 rounded-xl bg-magenta px-4 py-2.5 text-xs font-semibold text-white shadow-[0_8px_20px_-10px_rgba(147,43,156,0.7)] transition-all hover:brightness-110"
        >
          <Plus size={14} /> Nouveau dossier
        </Link>
      </EnTete>

      <div className="px-5 pt-6 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Data
            libelle="Préparations en cours" valeur={enCours} unite={`/ ${aVenir.length}`}
            detail="Patients dont l’échéancier SMS n’est pas terminé"
            icone={<UsersRound size={15} />}
          />
          <Data
            libelle="À rappeler" valeur={file.length}
            detail={file.length ? 'Un appel par patient, motifs regroupés' : 'Aucun écart en attente'}
            ton={file.length ? 'ruby' : 'emerald'} icone={<PhoneCall size={15} />}
          />
          <Data
            libelle="Conformité des déclarations" valeur={conformite ?? '—'} unite={conformite === null ? '' : '%'}
            detail="Points acquis sur les étapes déjà échues"
            ton={conformite === null ? 'neutre' : conformite >= 80 ? 'emerald' : conformite >= 50 ? 'amber' : 'ruby'}
            icone={<ListChecks size={15} />}
          />
          <Data
            libelle="Vacation du jour" valeur={`${prets}/${duJour.length}`}
            detail="Patients prêts pour leur examen aujourd’hui"
            ton={duJour.length && prets === duJour.length ? 'emerald' : 'amber'} icone={<ShieldCheck size={15} />}
          />
        </div>

        <section className="mt-8">
          <Titre
            icone={<PhoneCall size={14} />}
            action={file.length > 3 ? <Link to="/rappels" className="text-[11px] font-medium text-magenta hover:underline">Voir les {file.length} rappels →</Link> : null}
          >
            À rappeler
            {file.length ? <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{file.length}</span> : null}
          </Titre>
          <FileRappels file={file.slice(0, 3)} />
        </section>

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <section>
            <Titre icone={<CalendarDays size={14} />} action={<Link to="/vacations" className="text-[11px] font-medium text-magenta hover:underline">Toutes les vacations →</Link>}>Vacation du jour</Titre>
            {duJour.length ? (
              <>
                {aDeplacer ? (
                  <div className="mb-4 rounded-xl border border-amber-400/50 bg-amber-50/70 p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                      <AlertTriangle size={15} /> Ordre de passage à revoir
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-700">
                      {aDeplacer} patient(s) gagneraient à passer plus tard : deux heures de plus suffisent souvent à rattraper
                      une préparation incomplète, là où un report coûte le créneau.
                    </p>
                  </div>
                ) : null}
                <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
                  <div>
                    <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Ordre prévu</p>
                    <div className="space-y-2">{duJour.map((p) => <Ligne key={p.id} patient={p} />)}</div>
                  </div>
                  <div>
                    <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Ordre conseillé</p>
                    <div className="space-y-2">{conseille.map((p, i) => <Ligne key={p.id} patient={p} rang={`${i + 1}`} />)}</div>
                  </div>
                </div>
              </>
            ) : (
              <p className="rounded-xl border border-navy/[0.07] bg-white/60 p-5 text-sm text-slate-600">Pas de vacation aujourd’hui.</p>
            )}

            <div className="mt-8">
              <Titre icone={<CalendarDays size={14} />}>Les 7 prochains jours</Titre>
              <div className="space-y-5">
                {parJour.map((g) => (
                  <div key={g.cle}>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {jourCourt(g.date)} · {g.patients.length} examen{g.patients.length > 1 ? 's' : ''}
                    </p>
                    <div className="space-y-2">{g.patients.map((p) => <Ligne key={p.id} patient={p} />)}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-8">
            <section>
              <Titre icone={<Send size={14} />}>SMS des prochaines 24 h</Titre>
              {envois.length ? (
                <ol className="space-y-2">
                  {envois.map((s) => (
                    <li key={`${s.patient.id}-${s.etape.id}`}>
                      <Link to={`/patients/${s.patient.id}?onglet=sms`} className="flex items-center gap-3 rounded-xl border border-navy/[0.07] bg-white/60 p-3 transition-colors hover:bg-white/85">
                        <span className="w-14 shrink-0 text-xs font-bold tabular-nums text-navy">{heure(s.envoi)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-navy">{nomComplet(s.patient)}</span>
                          <span className="block truncate text-[11px] text-slate-500">{s.cle} — {s.etape.titre}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="rounded-xl border border-navy/[0.07] bg-white/60 p-4 text-xs text-slate-600">Aucun envoi programmé d’ici demain.</p>
              )}
            </section>

            <section>
              <Titre icone={<Banknote size={14} />}>Ce que le suivi protège</Titre>
              <div className="rounded-2xl border border-white/70 bg-white/70 p-5 shadow-[0_16px_36px_-14px_rgba(5,28,78,0.18)]">
                <p className="text-3xl font-extrabold tracking-tight text-navy">
                  {(interceptes * cabinet.valeurCreneau).toLocaleString('fr-FR')} <span className="text-sm font-medium text-slate-600">€</span>
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  {interceptes} examen{interceptes > 1 ? 's' : ''} compromis en l’état, encore rattrapable{interceptes > 1 ? 's' : ''} avant l’arrivée
                  du patient — valorisé{interceptes > 1 ? 's' : ''} à {cabinet.valeurCreneau} € le créneau (réglable).
                </p>
                <p className="mt-3 border-t border-navy/[0.07] pt-3 text-[11px] leading-relaxed text-slate-500">
                  Un montant rattrapable, pas une perte évitée à coup sûr. Le gain réel se mesure en comparant le taux
                  d’examens à refaire avant et après la mise en service.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}
