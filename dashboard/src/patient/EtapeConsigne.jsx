import { useState } from 'react';
import { Check, Clock, GlassWater, AlertTriangle, Info, Pill, Salad } from '../components/icones.js';
import GlassCard from '../components/GlassCard.jsx';
import { Bouton, CarteChoix, Libelle } from '../components/ui.jsx';
import { ETAPES } from '../lib/examens.js';
import { store } from '../lib/store.js';
import Coque from './Coque.jsx';

const ICONES = { Pill, Clock, GlassWater, AlertTriangle, Info, Salad };
const TON_ICONE = { AlertTriangle: 'text-rose-600' };

/**
 * Écran générique des étapes de consigne.
 *
 * Les sevrages — anti-acides avant une pH-métrie, antibiotiques avant un test
 * respiratoire, purge avant une vidéocapsule — posent tous la même question :
 * voici ce qu'il faut arrêter, l'avez-vous fait. Écrire quatre écrans pour
 * quatre fois la même chose aurait multiplié les endroits où se tromper. Le
 * contenu vit dans le catalogue, l'écran n'en est que le rendu.
 */
export default function EtapeConsigne({ patient, etapeId, onFermer }) {
  const etape = ETAPES[etapeId];
  const { points = [], question, engagement } = etape.consigne ?? {};
  const d = patient.etapes[etapeId] ?? {};
  const dejaFait = Boolean(d.done);

  const [compris, setCompris] = useState(d.compris ?? false);
  const [reponse, setReponse] = useState(question ? d[question.cle] ?? null : null);

  function valider() {
    store.majEtape(patient.id, etapeId, {
      compris,
      ...(question ? { [question.cle]: reponse } : {}),
    });
    onFermer();
  }

  return (
    <Coque
      etape={etape}
      patient={patient}
      onFermer={onFermer}
      lecture={dejaFait}
      pied={dejaFait ? null : (
        <Bouton
          ton={reponse === false ? 'amber' : 'emerald'}
          disabled={!compris || (question && reponse === null)}
          onClick={valider}
          className="w-full"
        >
          <Check size={16} /> Envoyer ma réponse
        </Bouton>
      )}
    >
      <GlassCard deep className="p-5">
        <ol className="space-y-4">
          {points.map(([icone, titre, detail]) => {
            const Icone = ICONES[icone] ?? Info;
            return (
              <li key={titre} className="flex gap-3">
                <Icone size={18} className={`mt-0.5 shrink-0 ${TON_ICONE[icone] ?? 'text-navy'}`} />
                <div>
                  <p className="text-sm font-semibold text-navy">{titre}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </GlassCard>

      {question ? (
        <section>
          <Libelle className="mb-3">{question.titre}</Libelle>
          <div className="space-y-2.5">
            <CarteChoix
              actif={reponse === true}
              onClick={dejaFait ? () => {} : () => setReponse(true)}
              ton="emerald"
              titre={question.oui}
            />
            <CarteChoix
              actif={reponse === false}
              onClick={dejaFait ? () => {} : () => setReponse(false)}
              ton="ruby"
              titre={question.non}
              detail={question.nonDetail}
            />
          </div>
        </section>
      ) : null}

      {engagement ? (
        <button
          type="button"
          disabled={dejaFait}
          onClick={() => setCompris(!compris)}
          aria-pressed={compris}
          className={`w-full rounded-xl border p-4 text-left text-sm transition-colors disabled:cursor-default ${compris ? 'border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-800' : 'border-navy/[0.09] bg-white/55 text-slate-800'}`}
        >
          {compris ? '✓ ' : ''}{engagement}
        </button>
      ) : null}
    </Coque>
  );
}
