import { useState } from 'react';
import { Settings, MessageSquare, Pill, ListChecks, Building2, HeartPulse, Check } from '../components/icones.js';
import { PROTOCOLES } from '../lib/protocols.js';
import { EXAMENS, ETAPES, ANESTHESIES } from '../lib/examens.js';
import { TRAITEMENTS, comorbidite } from '../lib/terrain.js';
import { store, useCabinet } from '../lib/store.js';
import { EnTete } from './Coquille.jsx';

function Bloc({ titre, icone, children, note, className = '' }) {
  return (
    <section className={`rounded-2xl border border-navy/[0.07] bg-white/60 p-5 backdrop-blur-2xl ${className}`}>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
        {icone} {titre}
      </p>
      <div className="mt-4">{children}</div>
      {note ? <p className="mt-4 text-[11px] leading-relaxed text-slate-500">{note}</p> : null}
    </section>
  );
}

const champ = 'w-full rounded-xl border border-navy/[0.1] bg-white/80 px-3.5 py-2.5 text-sm text-navy outline-none focus:border-magenta/50';

function Cabinet() {
  const cabinet = useCabinet();
  const [f, setF] = useState(cabinet);
  const [ok, setOk] = useState(false);
  const maj = (patch) => { setF({ ...f, ...patch }); setOk(false); };

  return (
    <Bloc titre="Le cabinet" icone={<Building2 size={14} />} note="Le nom court et le téléphone sont insérés dans chaque SMS. L’expéditeur est limité à 11 caractères par les opérateurs.">
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          store.majCabinet({ ...f, valeurCreneau: Number(f.valeurCreneau) || 0 });
          setOk(true);
        }}
      >
        <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-medium text-slate-700">Raison sociale</span>
          <input className={champ} value={f.nom} onChange={(e) => maj({ nom: e.target.value })} />
        </label>
        <label><span className="mb-1.5 block text-xs font-medium text-slate-700">Nom court (dans les SMS)</span>
          <input className={champ} value={f.nomCourt} onChange={(e) => maj({ nomCourt: e.target.value })} />
        </label>
        <label><span className="mb-1.5 block text-xs font-medium text-slate-700">Expéditeur SMS</span>
          <input className={champ} maxLength={11} value={f.expediteur} onChange={(e) => maj({ expediteur: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') })} />
        </label>
        <label><span className="mb-1.5 block text-xs font-medium text-slate-700">Téléphone du secrétariat</span>
          <input className={champ} value={f.telephone} onChange={(e) => maj({ telephone: e.target.value })} />
        </label>
        <label><span className="mb-1.5 block text-xs font-medium text-slate-700">Valeur d’un créneau perdu (€)</span>
          <input className={champ} type="number" min={0} step={10} value={f.valeurCreneau} onChange={(e) => maj({ valeurCreneau: e.target.value })} />
        </label>
        <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-700">Praticiens</p>
            <ul className="space-y-1 text-sm text-navy">{cabinet.praticiens.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-700">Lieux d’examen</p>
            <ul className="space-y-1 text-sm text-navy">{cabinet.lieux.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-xs font-semibold text-white hover:brightness-125">
            {ok ? <><Check size={13} /> Enregistré</> : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Bloc>
  );
}

export default function Reglages() {
  return (
    <>
      <EnTete titre="Réglages" question="Le cabinet, les examens, les préparations, les consignes et les messages envoyés." />

      <div className="grid gap-4 px-5 pt-6 sm:px-8 xl:grid-cols-2">
        <Cabinet />

        <Bloc titre="Examens et échéanciers" icone={<ListChecks size={14} />} note="Les points de chaque étape composent l’index de préparation sur 100.">
          <div className="space-y-3">
            {Object.values(EXAMENS).map((ex) => (
              <div key={ex.id} className="rounded-xl border border-navy/[0.07] bg-white/60 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-navy">{ex.label}</p>
                  <p className="text-[11px] text-slate-600">{ex.purge ? 'Purge colique' : ex.id === 'RECTO' ? 'Lavements' : 'Jeûne seul'} · {ANESTHESIES[ex.anesthesie].label.toLowerCase()} par défaut</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {ex.etapes.map((id) => (
                    <span key={id} className="rounded-lg border border-navy/[0.08] bg-white/80 px-2.5 py-1 text-[11px] text-slate-700">
                      <span className="font-bold text-navy">{ETAPES[id].cle({ examen: { renforce: false, schema: 'FRACTIONNE' } })}</span> {ETAPES[id].titre} · {ex.poids[id]} pts
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Bloc>

        <Bloc
          titre="Préparations coliques" icone={<Pill size={14} />}
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
                <p className="mt-1 text-[11px] text-rose-700">Contre-indiqué si : {p.contreIndications.map((c) => comorbidite(c).label).join(', ')}</p>
              </div>
            ))}
          </div>
        </Bloc>

        <Bloc titre="Traitements et consignes usuelles" icone={<HeartPulse size={14} />} note="Consignes usuelles des sociétés savantes, rappelées au cabinet et au patient. Elles restent à valider par le prescripteur, patient par patient.">
          <div className="space-y-2.5">
            {TRAITEMENTS.map((t) => (
              <div key={t.id} className="rounded-xl border border-navy/[0.07] bg-white/60 p-3.5">
                <p className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-navy">{t.label}</span>
                  <span className="text-[11px] text-slate-500">{t.exemples}</span>
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-700">{t.consigne}</p>
              </div>
            ))}
          </div>
        </Bloc>

        <Bloc
          titre="Messages envoyés" icone={<MessageSquare size={14} />}
          note="Chaque SMS porte un lien unique, ouvert après confirmation de l’année de naissance. Aucun mot de passe n’est demandé au patient."
        >
          <div className="space-y-3">
            {Object.values(ETAPES).map((e) => (
              <div key={e.id} className="rounded-xl border border-navy/[0.07] bg-white/60 p-4">
                <p className="text-sm font-bold text-navy">{e.titre}</p>
                <p className="mt-2 text-xs italic leading-relaxed text-slate-700">« {e.sms} »</p>
              </div>
            ))}
          </div>
        </Bloc>

        <Bloc titre="Portée de l’outil" icone={<Settings size={14} />}>
          <div className="space-y-3 text-xs leading-relaxed text-slate-700">
            <p>
              Endova accompagne la préparation et signale les écarts déclarés, jusqu’à l’arrivée du patient sur le lieu
              d’examen. Il ne pose aucun diagnostic et ne remplace ni la consultation d’anesthésie, ni la cotation
              per-endoscopique du score de Boston.
            </p>
            <p>
              Le Boston prévisionnel affiché dans la fiche est une projection à partir de déclarations, non une mesure.
              Il oriente une décision d’organisation — rappeler, prescrire un lavement, décaler le passage — jamais une
              décision diagnostique.
            </p>
            <p className="rounded-lg border border-amber-400/50 bg-amber-50/60 p-3 text-amber-800">
              Dès lors qu’une de ces recommandations est suivie en pratique, l’outil peut entrer dans le champ du
              règlement européen sur les dispositifs médicaux. À arbitrer avant toute mise en service réelle.
            </p>
          </div>
        </Bloc>
      </div>
    </>
  );
}
