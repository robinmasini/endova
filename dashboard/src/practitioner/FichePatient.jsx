import { X, PhoneCall, RefreshCw, ArrowDownWideNarrow, CheckCircle2, AlertTriangle, XCircle, Circle, ExternalLink } from '../components/icones.js';
import { Link } from 'react-router-dom';
import GlassCard from '../components/GlassCard.jsx';
import SchemaDigestif from '../components/SchemaDigestif.jsx';
import { AnneauScore, Badge, Bouton, Libelle, TONS } from '../components/ui.jsx';
import { calculerScore, statutRisque, alertes, PONDERATION } from '../lib/score.js';
import { PROTOCOLES, COUT_CRENEAU, ETAPES, ECHELLE_EVACUATION } from '../lib/protocols.js';

/** Résumé lisible d'une étape, tel qu'il doit apparaître dans la traçabilité. */
function resume(patient, id) {
  const e = patient.etapes[id];
  if (!e?.done) return { texte: 'En attente', ton: 'neutre', icone: Circle };
  switch (id) {
    case 'j7': {
      if (e.anticoagulant !== 'AUCUN' && e.consigneArret === false)
        return { texte: 'Anticoagulant sans consigne', ton: 'ruby', icone: XCircle };
      if (!e.purgeRecuperee) return { texte: 'Purge non récupérée', ton: 'amber', icone: AlertTriangle };
      return { texte: 'Confirmé', ton: 'emerald', icone: CheckCircle2 };
    }
    case 'j3':
      return e.ecarts?.length
        ? { texte: `${e.ecarts.length} écart(s)`, ton: 'amber', icone: AlertTriangle }
        : { texte: 'Guide consulté', ton: 'emerald', icone: CheckCircle2 };
    case 'j1':
      return {
        COMPLETE: { texte: `${e.verresBus}/4 verres — tolérée`, ton: 'emerald', icone: CheckCircle2 },
        PARTIELLE: { texte: `${e.verresBus}/4 verres — nausées`, ton: 'amber', icone: AlertTriangle },
        VOMI: { texte: `${e.verresBus}/4 verres — rejet`, ton: 'ruby', icone: XCircle },
      }[e.tolerance];
    case 'h4': {
      const ech = ECHELLE_EVACUATION.find((x) => x.id === e.evacuation);
      return {
        texte: ech?.titre ?? '—',
        ton: e.evacuation >= 3 ? 'emerald' : e.evacuation === 2 ? 'amber' : 'ruby',
        icone: e.evacuation >= 3 ? CheckCircle2 : e.evacuation === 2 ? AlertTriangle : XCircle,
      };
    }
    case 'h2':
      if (!e.jeuneSigne) return { texte: 'Non signé', ton: 'ruby', icone: XCircle };
      return e.tabac
        ? { texte: 'Signé — tabac déclaré', ton: 'ruby', icone: XCircle }
        : { texte: 'Signé numériquement', ton: 'emerald', icone: CheckCircle2 };
    default:
      return { texte: '—', ton: 'neutre', icone: Circle };
  }
}

export default function FichePatient({ patient, onFermer }) {
  const { total, detail, acquisPossible } = calculerScore(patient);
  const statut = statutRisque(patient);
  const liste = alertes(patient);
  const protocole = PROTOCOLES[patient.protocole];
  const induction = new Date(patient.heureInduction);

  return (
    <>
      <button
        type="button"
        aria-label="Fermer la fiche"
        onClick={onFermer}
        className="fixed inset-0 z-40 bg-navy/15 backdrop-blur-sm"
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col overflow-y-auto border-l border-navy/[0.09] bg-white/88 text-slate-900 shadow-2xl">
        <div className="p-7 pt-[calc(env(safe-area-inset-top,0px)+1.75rem)]">
          <header className="flex items-start justify-between gap-4 border-b border-navy/[0.09] pb-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-navy">
                  {patient.nom.toUpperCase()} {patient.prenom}
                </h2>
                <Badge ton="marque">{new Date().getFullYear() - patient.anneeNaissance} ans</Badge>
              </div>
              <p className="mt-1.5 text-sm text-slate-600">
                {patient.acte} — {induction.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                <span className="text-slate-500"> · </span>
                {protocole.nom}
              </p>
            </div>
            <button
              type="button"
              onClick={onFermer}
              aria-label="Fermer"
              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-white/80 hover:text-navy"
            >
              <X size={18} />
            </button>
          </header>

          <div className="mt-6 grid gap-4">
            <GlassCard plat glow={statut.ton} className="flex items-center gap-5 p-5">
              <AnneauScore valeur={total} ton={statut.ton} taille={96} epaisseur={8}>
                <span className="text-2xl font-extrabold text-navy">{total}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-600">/ 100</span>
              </AnneauScore>
              <div className="min-w-0">
                <Libelle>Index Endova</Libelle>
                <p className={`mt-1.5 text-base font-semibold ${TONS[statut.ton].texte}`}>{statut.label}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  {total} points acquis sur {acquisPossible} échus — pondération détaillée ci-dessous.
                </p>
              </div>
            </GlassCard>

            <GlassCard plat className="p-5">
              <Libelle>Pondération du score</Libelle>
              <div className="mt-3 space-y-2">
                {Object.entries(PONDERATION).map(([k, p]) => (
                  <div key={k} className="flex items-center gap-2.5">
                    <span className="w-9 shrink-0 text-[10px] font-bold uppercase text-slate-600">
                      {ETAPES.find((e) => e.id === k)?.cle}
                    </span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/55">
                      <span
                        className={`block h-full rounded-full transition-all duration-500 ${
                          detail[k] === p.poids ? 'bg-emerald-500' : detail[k] > 0 ? 'bg-amber-500' : 'bg-navy/10'
                        }`}
                        style={{ width: `${(detail[k] / p.poids) * 100}%` }}
                      />
                    </span>
                    <span className="w-11 shrink-0 text-right text-[11px] tabular-nums text-slate-600">
                      {detail[k]}/{p.poids}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          <section className="mt-6">
            <Libelle className="mb-3">Projection anatomique</Libelle>
            <GlassCard plat className="p-5">
              <SchemaDigestif patient={patient} />
            </GlassCard>
          </section>

          {liste.length ? (
            <section className="mt-6">
              <Libelle className="mb-3">Alertes actives</Libelle>
              <div className="space-y-2.5">
                {liste.map((a) => (
                  <GlassCard plat key={a.code} glow={a.ton} className="p-4">
                    <p className={`flex items-center gap-2 text-sm font-semibold ${TONS[a.ton].texte}`}>
                      <AlertTriangle size={15} /> {a.titre}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-700">{a.detail}</p>
                    <p className="mt-2 text-[11px] font-medium text-slate-600">→ {a.action}</p>
                  </GlassCard>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-6">
            <Libelle className="mb-3">Points de contrôle médicaux</Libelle>
            <div className="space-y-2.5">
              {ETAPES.map((etape) => {
                const r = resume(patient, etape.id);
                const Icone = r.icone;
                const e = patient.etapes[etape.id];
                return (
                  <div
                    key={etape.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-navy/[0.07] bg-white/55 p-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Icone size={17} className={`shrink-0 ${TONS[r.ton].texte}`} />
                      <div className="min-w-0">
                        <p className="truncate text-sm text-slate-800">
                          <span className="font-semibold text-slate-600">{etape.cle}</span> — {etape.titre}
                        </p>
                        {e?.at ? (
                          <p className="text-[11px] text-slate-500">
                            {new Date(e.at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <span className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-medium ${TONS[r.ton].fond} ${TONS[r.ton].texte}`}>
                      {r.texte}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-7">
            <Libelle className="mb-3">Actions correctives</Libelle>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <a
                href={`tel:${patient.telephone}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-magenta/30 bg-magenta/[0.07] px-4 py-3.5 text-sm font-medium text-magenta transition-all hover:brightness-125"
              >
                <PhoneCall size={15} /> Appeler le patient
              </a>
              <Bouton ton="amber">
                <RefreshCw size={15} /> Lavement de secours
              </Bouton>
              <Bouton ton="amber">
                <ArrowDownWideNarrow size={15} /> Décaler en fin de programme
              </Bouton>
              <Link
                to={`/p/${patient.token}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-navy/[0.09] bg-white/60 px-4 py-3.5 text-sm font-medium text-slate-700 transition-all hover:bg-white/85"
              >
                <ExternalLink size={15} /> Ouvrir sa PWA
              </Link>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              Décaler le patient en fin de programme prolonge son jeûne de 2 h et laisse agir la préparation —
              c’est souvent préférable à l’annulation sèche du créneau ({COUT_CRENEAU} € de perte).
            </p>
          </section>
        </div>
      </aside>
    </>
  );
}
