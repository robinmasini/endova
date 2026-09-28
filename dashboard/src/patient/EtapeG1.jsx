import { useState } from 'react';
import { Check, Clock, GlassWater, AlertTriangle, Ban } from '../components/icones.js';
import GlassCard from '../components/GlassCard.jsx';
import { Bouton, CarteChoix, Libelle } from '../components/ui.jsx';
import { ETAPES } from '../lib/examens.js';
import { heure } from '../lib/patient.js';
import { store } from '../lib/store.js';
import { limiteSolides } from '../lib/sms.js';
import Coque from './Coque.jsx';

const ETAPE = ETAPES.g1;
const H = 3600 * 1000;

/** Veille de gastroscopie : pas de purge, tout se joue sur le jeûne. */
export default function EtapeG1({ patient, onFermer }) {
  const d = patient.etapes.g1 ?? {};
  const dejaFait = Boolean(d.done);
  const glp1 = patient.terrain.traitements?.includes('GLP1');
  const insuline = patient.terrain.traitements?.includes('INSULINE');
  const examen = new Date(patient.examen.date).getTime();

  const [compris, setCompris] = useState(d.compris ?? false);
  const [liquides, setLiquides] = useState(d.liquidesClairs ?? null);

  function valider() {
    store.majEtape(patient.id, 'g1', { compris, liquidesClairs: glp1 ? liquides : null });
    onFermer();
  }

  return (
    <Coque
      etape={ETAPE}
      patient={patient}
      onFermer={onFermer}
      lecture={dejaFait}
      pied={dejaFait ? null : (
        <Bouton ton={liquides === false ? 'amber' : 'emerald'} disabled={!compris || (glp1 && liquides === null)} onClick={valider} className="w-full">
          <Check size={16} /> J’ai compris mes consignes
        </Bouton>
      )}
    >
      <GlassCard deep className="p-5">
        <ol className="space-y-4">
          <li className="flex gap-3">
            <Clock size={18} className="mt-0.5 shrink-0 text-magenta" />
            <div>
              <p className="text-sm font-semibold text-navy">Dernier repas léger avant {limiteSolides(patient)}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">Ensuite, plus aucun aliment solide, ni lait, ni chewing-gum.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <GlassWater size={18} className="mt-0.5 shrink-0 text-magenta" />
            <div>
              <p className="text-sm font-semibold text-navy">Liquides clairs jusqu’à {heure(examen - 2 * H)}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">Eau, thé ou café sans lait, jus sans pulpe. Pas d’alcool.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <Ban size={18} className="mt-0.5 shrink-0 text-rose-600" />
            <div>
              <p className="text-sm font-semibold text-navy">Puis plus rien, tabac compris</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">Un estomac qui n’est pas vide rend l’anesthésie dangereuse.</p>
            </div>
          </li>
        </ol>
      </GlassCard>

      {insuline ? (
        <GlassCard glow="amber" className="p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-700"><AlertTriangle size={15} /> Diabète</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-700">
            Suivez la consigne d’adaptation de vos doses remise par votre médecin. En cas de malaise, prenez du sucre dans l’eau
            et prévenez-nous : cela ne compte pas comme une rupture du jeûne si c’est avant {heure(examen - 2 * H)}.
          </p>
        </GlassCard>
      ) : null}

      {glp1 ? (
        <section>
          <Libelle className="mb-2">Votre traitement injectable</Libelle>
          <p className="mb-3 text-xs leading-relaxed text-slate-600">
            Il ralentit la digestion : l’estomac peut rester plein bien après le repas. Depuis ce matin, vous ne devez prendre
            que des liquides clairs.
          </p>
          <div className="space-y-2.5">
            <CarteChoix actif={liquides === true} onClick={dejaFait ? () => {} : () => setLiquides(true)} ton="emerald" titre="Oui, uniquement des liquides clairs aujourd’hui" />
            <CarteChoix actif={liquides === false} onClick={dejaFait ? () => {} : () => setLiquides(false)} ton="ruby" titre="Non, j’ai mangé aujourd’hui" detail="Dites-le : l’anesthésiste adaptera l’heure de votre passage." />
          </div>
        </section>
      ) : null}

      <button
        type="button"
        disabled={dejaFait}
        onClick={() => setCompris(!compris)}
        aria-pressed={compris}
        className={`w-full rounded-xl border p-4 text-left text-sm transition-colors disabled:cursor-default ${compris ? 'border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-800' : 'border-navy/[0.09] bg-white/55 text-slate-800'}`}
      >
        {compris ? '✓ ' : ''}J’ai lu les heures limites et je m’engage à les respecter.
      </button>
    </Coque>
  );
}
