import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ChevronRight, ListChecks, ShieldCheck, UsersRound, CalendarDays, Send, Plus, Banknote, Settings,
} from '../components/icones.js';
import { useDossiers } from '../lib/store.js';
import { calculerScore, statutRisque, alertesActives } from '../lib/score.js';
import { etapesDe, joursAvant } from '../lib/examens.js';
import { prochainsEnvois, smsEchus } from '../lib/sms.js';
import { examenDe, heure, jourCourt, nomComplet } from '../lib/patient.js';
import { TONS } from '../components/ui.jsx';
import { EnTete } from './Coquille.jsx';
import Jalon from '../components/Jalon.jsx';
import TiroirPatient from '../components/TiroirPatient.jsx';

/**
 * Tuile de tête. Elle montre un chiffre et, quand elle en porte un, filtre la
 * liste sur les dossiers qu'elle compte. Une tuile d'alerte se teinte de rouge :
 * c'est la seule du tableau qu'on ne doit pas pouvoir ne pas voir.
 */
function Data({ libelle, valeur, unite, detail, ton = 'marque', icone, onClick, actif }) {
  const t = TONS[ton];
  const alerte = ton === 'ruby';
  const Balise = onClick ? 'button' : 'div';
  const peau = alerte
    ? 'border-rose-300 bg-rose-50/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_16px_36px_-10px_rgba(190,18,60,0.26)]'
    : 'border-white/70 bg-white/70 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.95),0_2px_4px_0_rgba(5,28,78,0.04),0_16px_36px_-10px_rgba(5,28,78,0.14)]';
  const marque = actif ? (alerte ? 'ring-2 ring-rose-500/70' : 'ring-2 ring-navy/45') : '';
  return (
    <Balise
      {...(onClick ? { type: 'button', onClick, 'aria-pressed': actif } : {})}
      className={`relative w-full rounded-2xl border p-5 text-left backdrop-blur-2xl backdrop-saturate-[180%] transition-all duration-300 ${peau} ${marque} ${onClick ? 'hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40' : ''}`}
    >
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
    </Balise>
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

function Ligne({ patient, rang, actif, onOuvrir }) {
  const { total } = calculerScore(patient);
  const statut = statutRisque(patient);
  const nb = alertesActives(patient).length;
  const courante = etapesDe(patient).find((e) => !patient.etapes[e.id]?.done);

  return (
    <button
      type="button"
      onClick={() => onOuvrir?.(patient.id)}
      aria-pressed={actif}
      className={`group flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all duration-200 hover:bg-white/85 ${
        actif ? 'border-navy/40 bg-white/90 ring-1 ring-navy/20'
          : statut.ton === 'ruby' ? 'border-rose-400/40 bg-rose-50/60' : 'border-navy/[0.07] bg-white/60'
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
    </button>
  );
}

/**
 * Les dossiers rangés par le repère de l'étape où ils se trouvent.
 *
 * Un dossier dont la préparation est close n'a plus d'étape en cours : il
 * attend le jour J, et c'est son repère. Rien au-delà, l'outil est
 * préopératoire.
 */
function parJalon(patients) {
  const groupes = new Map();
  for (const p of patients) {
    const etape = etapesDe(p).find((e) => !p.etapes[e.id]?.done);
    const cle = etape ? etape.cle(p) : 'J-J';
    // Rang : l'écart entre l'envoi du SMS et l'examen, donc négatif. Le plus
    // lointain passe en premier, le jour J ferme la marche.
    const rang = etape ? etape.envoi(p) - new Date(p.examen.date) : 0;
    const g = groupes.get(cle) ?? { cle, rang, patients: [] };
    g.rang = Math.min(g.rang, rang);
    g.patients.push(p);
    groupes.set(cle, g);
  }
  for (const g of groupes.values()) {
    g.patients.sort((a, b) => new Date(a.examen.date) - new Date(b.examen.date));
  }
  return [...groupes.values()].sort((a, b) => a.rang - b.rang);
}

export default function Dashboard() {
  const { patients, cabinet } = useDossiers();
  const aVenir = patients.filter((p) => joursAvant(p) >= 0);
  const jalons = parJalon(aVenir);
  const [filtre, setFiltre] = useState(null);
  const [ouvert, setOuvert] = useState(null);
  const dossierOuvert = patients.find((p) => p.id === ouvert) ?? null;

  // Un dossier est « actif » quand son examen est dans les quatorze jours.
  // Au-delà, l'échéancier a commencé mais rien ne se joue encore.
  const actifs = aVenir.filter((p) => joursAvant(p) <= 14);
  const enAlerte = aVenir.filter((p) => alertesActives(p).length > 0);

  const basculer = (cle) => setFiltre(filtre === cle ? null : cle);

  const duJour = aVenir.filter((p) => joursAvant(p) === 0).sort((a, b) => new Date(a.examen.date) - new Date(b.examen.date));
  const semaine = aVenir.filter((p) => joursAvant(p) > 0 && joursAvant(p) <= 7).sort((a, b) => new Date(a.examen.date) - new Date(b.examen.date));
  const parJour = [];
  for (const p of semaine) {
    const cle = new Date(p.examen.date).toDateString();
    if (parJour.at(-1)?.cle !== cle) parJour.push({ cle, date: p.examen.date, patients: [] });
    parJour.at(-1).patients.push(p);
  }

  const prets = duJour.filter((p) => statutRisque(p).court === 'Prêt').length;
  const envois = prochainsEnvois(aVenir, cabinet);
  const echus = smsEchus(aVenir, cabinet).length;

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

  // Les vues du tableau : chaque tuile et chaque jalon désigne une liste.
  const VUES = {
    actifs: { libelle: 'en préparation active — examen dans les quatorze jours', liste: actifs },
    alertes: { libelle: 'en alerte', liste: enAlerte },
    jour: { libelle: 'dont l’examen a lieu aujourd’hui', liste: duJour },
  };
  const vue = filtre?.startsWith('jalon:')
    ? { libelle: `à l’étape ${filtre.slice(6)}`, liste: jalons.find((j) => j.cle === filtre.slice(6))?.patients ?? [] }
    : VUES[filtre] ?? { libelle: 'au total', liste: aVenir };
  const selection = [...vue.liste].sort((a, b) => new Date(a.examen.date) - new Date(b.examen.date));

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
          className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-xs font-semibold text-white shadow-[0_8px_20px_-10px_rgba(147,43,156,0.7)] transition-all hover:brightness-110"
        >
          <Plus size={14} /> Nouveau dossier
        </Link>
      </EnTete>

      <div className="px-5 pt-6 sm:px-8">
        {echus ? (
          <p className="mb-5 flex items-center gap-2.5 rounded-xl border border-navy/30 bg-navy/[0.06] px-4 py-3 text-sm text-navy">
            <Send size={15} className="shrink-0 text-navy" />
            <span><span className="font-semibold">{echus} SMS arrivé{echus > 1 ? 's' : ''} à échéance.</span> Touchez le bouton Endova pour les délivrer.</span>
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Data
            libelle="Préparations en cours" valeur={actifs.length} unite={`/ ${aVenir.length}`}
            detail="Examen dans les quatorze jours"
            icone={<UsersRound size={15} />}
            onClick={() => basculer('actifs')} actif={filtre === 'actifs'}
          />
          <Data
            libelle="Alertes" valeur={enAlerte.length}
            detail={enAlerte.length ? 'Dossiers à reprendre avant l’examen' : 'Aucun écart en attente'}
            ton={enAlerte.length ? 'ruby' : 'emerald'} icone={<AlertTriangle size={15} />}
            onClick={() => basculer('alertes')} actif={filtre === 'alertes'}
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
            onClick={duJour.length ? () => basculer('jour') : undefined} actif={filtre === 'jour'}
          />
        </div>

        <section className="mt-8">
          <Titre
            icone={<ListChecks size={14} />}
            action={filtre ? (
              <button type="button" onClick={() => setFiltre(null)} className="text-[11px] font-medium text-navy hover:underline">
                Tout afficher
              </button>
            ) : null}
          >
            Où en sont les patients
          </Titre>

          {jalons.length ? (
            <div className="flex flex-wrap gap-2.5">
              {jalons.map(({ cle, patients: groupe }) => (
                <button
                  key={cle}
                  type="button"
                  onClick={() => basculer(`jalon:${cle}`)}
                  aria-pressed={filtre === `jalon:${cle}`}
                  aria-label={`${cle} — ${groupe.length} patient${groupe.length > 1 ? 's' : ''}`}
                  className="rounded-full transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
                >
                  <Jalon taille="m" ton={filtre === `jalon:${cle}` ? 'plein' : 'clair'}>{cle}</Jalon>
                </button>
              ))}
            </div>
          ) : null}

          <p className="mt-4 mb-2.5 text-[11px] text-slate-600">
            {selection.length} patient{selection.length > 1 ? 's' : ''}{' '}
            {filtre === 'jalon:J-J' ? 'dont la préparation est close, en attente de l’examen' : vue.libelle}
          </p>
          {selection.length ? (
            <div className="space-y-2 rise">{selection.map((p) => <Ligne key={p.id} patient={p} actif={p.id === ouvert} onOuvrir={setOuvert} />)}</div>
          ) : (
            <p className="rounded-xl border border-navy/[0.07] bg-white/60 p-5 text-sm text-slate-600">Aucun dossier dans cette vue.</p>
          )}
        </section>

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <section>
            <Titre icone={<CalendarDays size={14} />} action={<Link to="/vacations" className="text-[11px] font-medium text-navy hover:underline">Toutes les vacations →</Link>}>Vacation du jour</Titre>
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
                    <div className="space-y-2">{duJour.map((p) => <Ligne key={p.id} patient={p} actif={p.id === ouvert} onOuvrir={setOuvert} />)}</div>
                  </div>
                  <div>
                    <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Ordre conseillé</p>
                    <div className="space-y-2">{conseille.map((p, i) => <Ligne key={p.id} patient={p} rang={`${i + 1}`} actif={p.id === ouvert} onOuvrir={setOuvert} />)}</div>
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
                    <div className="space-y-2">{g.patients.map((p) => <Ligne key={p.id} patient={p} actif={p.id === ouvert} onOuvrir={setOuvert} />)}</div>
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

      {dossierOuvert ? (
        <>
          <div
            onClick={() => setOuvert(null)}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-navy/25 backdrop-blur-sm"
          />
          <div className="fixed inset-x-4 bottom-4 top-4 z-50 sm:left-auto sm:right-4 sm:w-[23rem]">
            <TiroirPatient patient={dossierOuvert} onFermer={() => setOuvert(null)} />
          </div>
        </>
      ) : null}
    </>
  );
}
