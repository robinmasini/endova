import { Settings, MessageSquare, Pill, ListChecks } from '../components/icones.js';
import { PROTOCOLES, ETAPES, COUT_CRENEAU } from '../lib/protocols.js';
import { PONDERATION } from '../lib/score.js';
import { EnTete } from './Coquille.jsx';

function Bloc({ titre, icone, children, note }) {
  return (
    <section className="rounded-2xl border border-navy/[0.07] bg-white/60 p-5 backdrop-blur-2xl">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
        {icone} {titre}
      </p>
      <div className="mt-4">{children}</div>
      {note ? <p className="mt-4 text-[11px] leading-relaxed text-slate-500">{note}</p> : null}
    </section>
  );
}

export default function Reglages() {
  return (
    <>
      <EnTete titre="Réglages" question="Protocoles de purge, messages envoyés, pondération du score." />

      <div className="grid gap-4 px-5 pt-6 sm:px-8 xl:grid-cols-2">
        <Bloc
          titre="Protocoles de purge" icone={<Pill size={14} />}
          note="La cinétique d’ingestion pilote le minuteur guidé côté patient : un verre par intervalle, pas davantage."
        >
          <div className="space-y-3">
            {Object.values(PROTOCOLES).map((p) => (
              <div key={p.id} className="rounded-xl border border-navy/[0.07] bg-white/60 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-navy">{p.nom}</p>
                  <p className="text-[11px] text-slate-600">{p.famille}</p>
                </div>
                <p className="mt-1.5 text-xs text-slate-700">{p.volumeFraction}</p>
                <p className="mt-1 text-[11px] text-slate-600">
                  {p.verres} verres · 1 toutes les {p.intervalleMin} min · puis {p.eauClaireApres}
                </p>
              </div>
            ))}
          </div>
        </Bloc>

        <Bloc
          titre="Pondération du score" icone={<ListChecks size={14} />}
          note={`Un dossier sous 50 est classé « en péril » et valorisé à ${COUT_CRENEAU} € de créneau exposé. Le seuil de 80 marque le bloc sécurisé.`}
        >
          <div className="space-y-2.5">
            {Object.entries(PONDERATION).map(([cle, p]) => (
              <div key={cle} className="flex items-center gap-3">
                <span className="w-9 shrink-0 text-[10px] font-bold uppercase text-slate-500">
                  {ETAPES.find((e) => e.id === cle)?.cle}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-slate-700">{p.libelle}</span>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-navy">{p.poids} pts</span>
              </div>
            ))}
          </div>
        </Bloc>

        <Bloc
          titre="Messages envoyés" icone={<MessageSquare size={14} />}
          note="Chaque SMS porte un lien unique, ouvert après confirmation de l’année de naissance. Aucun mot de passe n’est demandé au patient."
        >
          <div className="space-y-3">
            {ETAPES.map((e) => (
              <div key={e.id} className="rounded-xl border border-navy/[0.07] bg-white/60 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-bold text-navy">{e.cle}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{e.heure}</p>
                </div>
                <p className="mt-2 text-xs italic leading-relaxed text-slate-700">« {e.sms} »</p>
              </div>
            ))}
          </div>
        </Bloc>

        <Bloc titre="Portée de l’outil" icone={<Settings size={14} />}>
          <div className="space-y-3 text-xs leading-relaxed text-slate-700">
            <p>
              Endova accompagne la préparation et signale les écarts déclarés. Il ne pose aucun diagnostic
              et ne remplace ni la consultation pré-anesthésique, ni la cotation per-endoscopique du score de Boston.
            </p>
            <p>
              Le Boston prévisionnel affiché sur la fiche patient est une projection à partir de déclarations,
              non une mesure. Il oriente une décision d’organisation — rappeler, prescrire un lavement, décaler
              le passage — jamais une décision diagnostique.
            </p>
            <p className="rounded-lg border border-amber-400/50 bg-amber-50/60 p-3 text-amber-800">
              Dès lors qu’une de ces recommandations est suivie en pratique, l’outil entre dans le champ du
              règlement européen sur les dispositifs médicaux. À arbitrer avant toute mise en service réelle.
            </p>
          </div>
        </Bloc>
      </div>
    </>
  );
}
