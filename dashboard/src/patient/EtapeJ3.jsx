import { useMemo, useState } from 'react';
import { Search, Check, X, Salad, Info } from '../components/icones.js';
import GlassCard from '../components/GlassCard.jsx';
import { Bascule, Bouton, Libelle } from '../components/ui.jsx';
import { ALIMENTS } from '../lib/foods.js';
import { ETAPES } from '../lib/protocols.js';
import { store } from '../lib/store.js';
import Coque from './Coque.jsx';

const ETAPE = ETAPES[1];

/** Normalise pour que « pate », « pâté » et « PÂTES » se répondent. */
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function Pastille({ aliment, onDeclarerEcart, ecart, verrouille }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-3.5 transition-colors ${
        aliment.ok ? 'border-emerald-500/20 bg-emerald-500/[0.06]' : 'border-rose-500/20 bg-rose-500/[0.06]'
      }`}
    >
      <span
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${
          aliment.ok ? 'bg-emerald-500/20 text-emerald-700' : 'bg-rose-500/20 text-rose-700'
        }`}
      >
        {aliment.ok ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{aliment.nom}</p>
        {aliment.motif ? <p className="mt-1 text-xs leading-relaxed text-slate-600">{aliment.motif}</p> : null}
        {!aliment.ok && !verrouille ? (
          <button
            type="button"
            onClick={onDeclarerEcart}
            className={`mt-2 text-[11px] font-medium transition-colors ${
              ecart ? 'text-amber-700' : 'text-slate-600 hover:text-amber-800'
            }`}
          >
            {ecart ? '✓ Écart déclaré — merci de votre franchise' : 'J’en ai consommé →'}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function EtapeJ3({ patient, onFermer }) {
  const dejaFait = patient.etapes.j3.done;
  const [regime, setRegime] = useState(patient.etapes.j3.regimeDemarre ?? false);
  const [ecarts, setEcarts] = useState(patient.etapes.j3.ecarts ?? []);
  const [q, setQ] = useState('');
  const [filtre, setFiltre] = useState('tous');

  const resultats = useMemo(() => {
    const requete = norm(q.trim());
    return ALIMENTS.filter((a) => {
      if (filtre === 'ok' && !a.ok) return false;
      if (filtre === 'non' && a.ok) return false;
      if (!requete) return true;
      return norm(a.nom).includes(requete) || norm(a.cat).includes(requete);
    });
  }, [q, filtre]);

  function basculerEcart(nom) {
    setEcarts((e) => (e.includes(nom) ? e.filter((x) => x !== nom) : [...e, nom]));
  }

  function valider() {
    store.majEtape(
      patient.id, 'j3',
      { regimeDemarre: regime, ecarts, guideConsulte: true },
      ecarts.length ? `${ecarts.length} écart(s) au régime déclaré(s)` : 'Régime sans résidu démarré',
    );
    onFermer();
  }

  return (
    <Coque
      etape={ETAPE}
      patient={patient}
      onFermer={onFermer}
      lecture={dejaFait}
      pied={
        dejaFait ? null : (
          <Bouton ton="emerald" disabled={!regime} onClick={valider} className="w-full">
            <Check size={16} /> J’ai compris le régime
          </Bouton>
        )
      }
    >
      <GlassCard className="p-5">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-700">
          <Info size={14} className="mt-0.5 shrink-0 text-magenta" />
          <span>
            Le critère n’est pas calorique, il est mécanique : une graine de kiwi ou un pépin de tomate survit
            intact jusqu’au côlon, bouche le canal d’aspiration de l’endoscope et masque la muqueuse.
            <span className="font-medium text-navy"> Un écart peut suffire à rendre l’examen ininterprétable.</span>
          </span>
        </p>
        <div className="mt-4">
          <Bascule
            actif={regime}
            onChange={dejaFait ? () => {} : setRegime}
            label="Je démarre le régime aujourd’hui"
            detail="À tenir sans interruption jusqu’à l’examen."
          />
        </div>
      </GlassCard>

      <section>
        <Libelle className="mb-3 flex items-center gap-1.5"><Salad size={13} /> Vérifier un aliment</Libelle>
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tapez un aliment : kiwi, riz, pain…"
            aria-label="Rechercher un aliment"
            className="w-full rounded-xl border border-navy/[0.09] bg-white/60 py-3.5 pl-10 pr-4 text-sm text-navy outline-none transition-colors placeholder:text-slate-600 focus:border-magenta/50"
          />
        </div>

        <div className="mt-3 flex gap-2">
          {[
            { id: 'tous', label: 'Tout' },
            { id: 'ok', label: 'Autorisé' },
            { id: 'non', label: 'Interdit' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltre(f.id)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                filtre === f.id
                  ? 'border-magenta/40 bg-magenta/10 text-magenta'
                  : 'border-navy/[0.09] bg-white/55 text-slate-600 hover:text-navy'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-2.5">
          {resultats.length === 0 ? (
            <GlassCard className="p-5 text-center">
              <p className="text-sm text-slate-700">Aliment non répertorié</p>
              <p className="mt-1.5 text-xs text-slate-600">
                Dans le doute, abstenez-vous et posez la question au secrétariat.
              </p>
            </GlassCard>
          ) : (
            resultats.map((a) => (
              <Pastille
                key={a.nom}
                aliment={a}
                ecart={ecarts.includes(a.nom)}
                verrouille={dejaFait}
                onDeclarerEcart={() => basculerEcart(a.nom)}
              />
            ))
          )}
        </div>
      </section>

      {ecarts.length ? (
        <GlassCard glow="amber" className="p-5 rise">
          <p className="text-sm font-semibold text-amber-700">{ecarts.length} écart(s) déclaré(s)</p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-700">
            {ecarts.join(', ')}. C’est transmis à l’équipe : mieux vaut un écart signalé qu’un examen annulé sur table.
          </p>
        </GlassCard>
      ) : null}
    </Coque>
  );
}
