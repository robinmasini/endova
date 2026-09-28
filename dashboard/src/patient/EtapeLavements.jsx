import { useState } from 'react';
import { Check, Droplets, Info } from '../components/icones.js';
import GlassCard from '../components/GlassCard.jsx';
import { Bouton, CarteChoix, Libelle } from '../components/ui.jsx';
import { ETAPES } from '../lib/examens.js';
import { heure } from '../lib/patient.js';
import { store } from '../lib/store.js';
import Coque from './Coque.jsx';

const H = 3600 * 1000;

/** Rectosigmoïdoscopie, veille : le patient a-t-il ses lavements ? */
export function EtapeR1({ patient, onFermer }) {
  const d = patient.etapes.r1 ?? {};
  const dejaFait = Boolean(d.done);
  const [enMain, setEnMain] = useState(d.lavementsEnMain ?? null);

  return (
    <Coque
      etape={ETAPES.r1}
      patient={patient}
      onFermer={onFermer}
      lecture={dejaFait}
      pied={dejaFait ? null : (
        <Bouton ton={enMain ? 'emerald' : 'amber'} disabled={enMain === null} onClick={() => { store.majEtape(patient.id, 'r1', { lavementsEnMain: enMain }); onFermer(); }} className="w-full">
          <Check size={16} /> Transmettre
        </Bouton>
      )}
    >
      <GlassCard className="p-5">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-700">
          <Info size={14} className="mt-0.5 shrink-0 text-magenta" />
          Pas de purge à boire : l’examen ne regarde que le rectum et le sigmoïde. Deux lavements rectaux suffisent,
          faits le matin même. Vous pouvez manger normalement aujourd’hui.
        </p>
      </GlassCard>
      <section>
        <Libelle className="mb-3">Avez-vous vos deux lavements ?</Libelle>
        <div className="space-y-2.5">
          <CarteChoix actif={enMain === true} onClick={dejaFait ? () => {} : () => setEnMain(true)} ton="emerald" titre="Oui, je les ai" detail="Type Normacol, prescrits sur votre ordonnance." />
          <CarteChoix actif={enMain === false} onClick={dejaFait ? () => {} : () => setEnMain(false)} ton="amber" titre="Pas encore" detail="Le cabinet vous indiquera une pharmacie ouverte." />
        </div>
      </section>
    </Coque>
  );
}

/** Matin de l'examen : deux lavements à une heure d'intervalle, puis le résultat. */
export default function EtapeLavements({ patient, onFermer }) {
  const d = patient.etapes.lav ?? {};
  const dejaFait = Boolean(d.done);
  const [faits, setFaits] = useState(d.lavementsFaits ?? 0);
  const [resultat, setResultat] = useState(d.resultat ?? null);
  const examen = new Date(patient.examen.date).getTime();

  return (
    <Coque
      etape={ETAPES.lav}
      patient={patient}
      onFermer={onFermer}
      lecture={dejaFait}
      pied={dejaFait ? null : (
        <Bouton ton={faits === 2 && resultat === 'CLAIR' ? 'emerald' : 'amber'} disabled={faits === 0 || !resultat} onClick={() => { store.majEtape(patient.id, 'lav', { lavementsFaits: faits, resultat }); onFermer(); }} className="w-full">
          <Check size={16} /> Transmettre
        </Bouton>
      )}
    >
      <GlassCard deep className="p-5">
        <ol className="space-y-3 text-sm text-slate-700">
          <li><span className="font-semibold text-navy">Vers {heure(examen - 3 * H)}</span> — premier lavement, à garder 5 à 10 minutes.</li>
          <li><span className="font-semibold text-navy">Vers {heure(examen - 2 * H)}</span> — second lavement, de la même façon.</li>
        </ol>
      </GlassCard>

      <section>
        <Libelle className="mb-3 flex items-center gap-1.5"><Droplets size={13} /> Lavements faits</Libelle>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((n) => (
            <CarteChoix key={n} actif={faits === n} onClick={dejaFait ? () => {} : () => setFaits(n)} ton={n === 2 ? 'emerald' : 'amber'} titre={`${n} / 2`} />
          ))}
        </div>
      </section>

      {faits > 0 ? (
        <section className="rise">
          <Libelle className="mb-3">Ce qui est ressorti la dernière fois</Libelle>
          <div className="space-y-2.5">
            <CarteChoix actif={resultat === 'CLAIR'} onClick={dejaFait ? () => {} : () => setResultat('CLAIR')} ton="emerald" titre="Surtout du liquide, clair ou légèrement teinté" />
            <CarteChoix actif={resultat === 'CHARGE'} onClick={dejaFait ? () => {} : () => setResultat('CHARGE')} ton="amber" titre="Encore des matières" detail="Un lavement complémentaire sera fait sur place." />
          </div>
        </section>
      ) : null}
    </Coque>
  );
}
