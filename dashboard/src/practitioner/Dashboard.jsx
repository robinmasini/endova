import { Link } from 'react-router-dom';
import {
  Activity, AlertTriangle, Banknote, ChevronRight, ListChecks,
  PhoneCall, ShieldCheck, TrendingUp, UsersRound,
} from '../components/icones.js';
import { useDossiers } from '../lib/store.js';
import FileRappels, { fileDAppels } from './FileRappels.jsx';
import { calculerScore, statutRisque, alertes, PONDERATION } from '../lib/score.js';
import { COUT_CRENEAU, ETAPES, PROTOCOLES } from '../lib/protocols.js';
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

function Ligne({ patient, rang }) {
  const { total } = calculerScore(patient);
  const statut = statutRisque(patient);
  const nb = alertes(patient).length;
  const induction = new Date(patient.heureInduction);

  return (
    <Link
      to={`?dossier=${patient.id}`}
      className={`group flex items-center gap-3 rounded-xl border p-3.5 transition-all duration-200 hover:bg-white/85 ${
        statut.ton === 'ruby' ? 'border-rose-400/40 bg-rose-50/60' : 'border-navy/[0.07] bg-white/60'
      }`}
    >
      <span className="w-7 shrink-0 text-center text-sm font-bold text-navy">{rang}</span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-navy">{patient.nom.toUpperCase()} {patient.prenom}</span>
          {nb ? (
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${TONS[statut.ton].texte}`}>
              <AlertTriangle size={11} /> {nb}
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block truncate text-xs text-slate-600">
          {induction.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {PROTOCOLES[patient.protocole].nom}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className={`block text-base font-bold tabular-nums ${TONS[statut.ton].texte}`}>{total}</span>
      </span>
      <ChevronRight size={15} className="shrink-0 text-slate-400 transition-colors group-hover:text-navy" />
    </Link>
  );
}

export default function Dashboard() {
  const { patients } = useDossiers();

  const scores = patients.map((p) => calculerScore(p).total);
  const moyenne = Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1));
  const securises = scores.filter((s) => s >= 80).length;
  const enPeril = scores.filter((s) => s < 50).length;

  // Actif = préparation engagée mais pas terminée. C'est la file réellement suivie.
  const actifs = patients.filter((p) => ETAPES.some((e) => !p.etapes[e.id]?.done)).length;
  const enAlerte = patients.filter((p) => alertes(p).length).length;
  const intercepte = patients.filter((p) => alertes(p).some((a) => a.ton === 'ruby')).length;
  const file = fileDAppels(patients);

  // Conformité : points acquis rapportés aux points atteignables sur les étapes échues.
  const [acquis, atteignable] = patients.reduce(
    ([a, m], p) => {
      const { detail } = calculerScore(p);
      return ETAPES.reduce(
        ([aa, mm], e) => (p.etapes[e.id]?.done ? [aa + detail[e.id], mm + PONDERATION[e.id].poids] : [aa, mm]),
        [a, m],
      );
    },
    [0, 0],
  );
  const conformite = atteignable ? Math.round((acquis / atteignable) * 100) : null;

  const parOrdre = [...patients].sort((a, b) => a.ordreBloc - b.ordreBloc);
  const conseille = [...patients].sort(
    (a, b) => calculerScore(b).total - calculerScore(a).total || a.ordreBloc - b.ordreBloc,
  );
  const aDeplacer = conseille.filter((p, i) => p.id !== parOrdre[i].id).length;

  return (
    <>
      <EnTete
        titre="Dashboard"
        question={`Vue d’ensemble · ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`}
      />

      <div className="px-5 pt-6 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Data
            libelle="Patients actifs" valeur={actifs} unite={`/ ${patients.length}`}
            detail="Préparation engagée, pas encore terminée"
            ton="marque" icone={<UsersRound size={15} />}
          />
          <Data
            libelle="Patients en alerte" valeur={enAlerte}
            detail={enAlerte ? 'Protocole non respecté — un appel est requis' : 'Tous les dossiers échus sont conformes'}
            ton={enAlerte ? 'ruby' : 'emerald'} icone={<AlertTriangle size={15} />}
          />
          <Data
            libelle="Conformité du suivi" valeur={conformite ?? '—'} unite={conformite === null ? '' : '%'}
            detail="Points acquis sur les étapes déjà échues"
            ton={conformite === null ? 'neutre' : conformite >= 80 ? 'emerald' : conformite >= 50 ? 'amber' : 'ruby'}
            icone={<ListChecks size={15} />}
          />
          <Data
            libelle="Index moyen du bloc" valeur={moyenne} unite="/ 100"
            detail={`${securises} dossier(s) au-dessus du seuil de 80`}
            ton={moyenne >= 80 ? 'emerald' : moyenne >= 50 ? 'amber' : 'ruby'}
            icone={<TrendingUp size={15} />}
          />
        </div>

        <section className="mt-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <PhoneCall size={14} /> À rappeler
              {file.length ? (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {file.length}
                </span>
              ) : null}
            </p>
            {file.length ? (
              <Link
                to="/patients?filtre=alerte"
                className="text-[11px] font-medium text-magenta transition-colors hover:underline"
              >
                Voir dans la liste patients →
              </Link>
            ) : null}
          </div>
          <FileRappels file={file} />
        </section>

        <section className="mt-8">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <Banknote size={14} /> Retour sur investissement du cabinet
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Data
              libelle="Valeur de bloc sécurisée" valeur={(securises * COUT_CRENEAU).toLocaleString('fr-FR')} unite="€"
              detail={`${securises} × ${COUT_CRENEAU} € — vacance de salle et acte coté préservés`}
              ton="emerald" icone={<ShieldCheck size={15} />}
            />
            <Data
              libelle="Incidents interceptés" valeur={intercepte}
              detail={`${(intercepte * COUT_CRENEAU).toLocaleString('fr-FR')} € encore rattrapables avant l’arrivée`}
              ton="marque" icone={<Activity size={15} />}
            />
            <Data
              libelle="Exposition résiduelle" valeur={(enPeril * COUT_CRENEAU).toLocaleString('fr-FR')} unite="€"
              detail={`${enPeril} créneau(x) sous le seuil de 50`}
              ton={enPeril ? 'ruby' : 'emerald'} icone={<AlertTriangle size={15} />}
            />
          </div>
          <p className="mt-3 rounded-xl border border-navy/[0.07] bg-white/50 p-4 text-[11px] leading-relaxed text-slate-600">
            Ces montants valorisent des créneaux <span className="font-semibold text-navy">encore rattrapables</span>,
            pas des annulations évitées de façon certaine. Le gain réel se mesurera en comparant le taux de
            préparation inadéquate avant et après mise en service.
          </p>
        </section>

        <section className="mt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-600">Programme du jour</p>

          {aDeplacer ? (
            <div className="mb-4 rounded-xl border border-amber-400/50 bg-amber-50/70 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                <AlertTriangle size={15} /> Reséquencement conseillé
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-700">
                {aDeplacer} dossier(s) gagneraient à passer plus tard : deux heures de jeûne supplémentaires
                suffisent souvent à rattraper une préparation incomplète, là où une annulation coûte le créneau entier.
              </p>
            </div>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Ordre actuel</p>
              <div className="space-y-2">
                {parOrdre.map((p) => <Ligne key={p.id} patient={p} rang={p.ordreBloc} />)}
              </div>
            </div>
            <div>
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Ordre conseillé · du mieux préparé au plus fragile
              </p>
              <div className="space-y-2">
                {conseille.map((p, i) => <Ligne key={p.id} patient={p} rang={i + 1} />)}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
