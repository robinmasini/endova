import { useState } from 'react';
import { Check, Eye, AlertTriangle } from '../components/icones.js';
import GlassCard from '../components/GlassCard.jsx';
import { Bouton, CarteChoix, Libelle, TONS } from '../components/ui.jsx';
import { ECHELLE_EVACUATION, ETAPES } from '../lib/protocols.js';
import { store } from '../lib/store.js';
import Coque from './Coque.jsx';

const ETAPE = ETAPES[3];

/** Carte de l'échelle visuelle : la pastille de couleur porte l'information, pas le texte. */
function CarteEvacuation({ item, actif, onClick, verrouille }) {
  const t = TONS[actif ? item.ton : 'neutre'];
  return (
    <button
      type="button"
      disabled={verrouille}
      onClick={onClick}
      aria-pressed={actif}
      className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 disabled:cursor-default ${
        actif ? `${t.bord} ${t.fond}` : 'border-navy/[0.07] bg-white/55 hover:border-navy/18'
      }`}
    >
      <span
        className="size-12 shrink-0 rounded-full border border-navy/15 shadow-inner"
        style={{ background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.35), ${item.couleur} 62%)` }}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-navy">{item.titre}</span>
        <span className="mt-0.5 block text-xs text-slate-600">{item.detail}</span>
        <span className={`mt-1.5 inline-block text-[11px] font-semibold ${actif ? t.texte : 'text-slate-600'}`}>
          {item.verdict}
        </span>
      </span>
      <span className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${actif ? `${t.bord} ${t.fond}` : 'border-navy/12'}`}>
        {actif ? <Check size={12} className={t.texte} strokeWidth={3} /> : null}
      </span>
    </button>
  );
}

export default function EtapeH4({ patient, protocole, onFermer }) {
  const dejaFait = patient.etapes.h4.done;
  const [tolerance, setTolerance] = useState(patient.etapes.h4.tolerance ?? null);
  const [evac, setEvac] = useState(patient.etapes.h4.evacuation ?? null);

  const choisi = ECHELLE_EVACUATION.find((e) => e.id === evac);
  const insuffisant = evac !== null && evac <= 2;

  function valider() {
    store.majEtape(
      patient.id, 'h4',
      { tolerance, evacuation: evac },
      insuffisant ? `Évacuation non conforme (${choisi.verdict})` : `Évacuation ${choisi.verdict.toLowerCase()}`,
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
          <Bouton ton={insuffisant ? 'amber' : 'emerald'} disabled={!tolerance || evac === null} onClick={valider} className="w-full">
            <Check size={16} /> Transmettre mon évaluation
          </Bouton>
        )
      }
    >
      <section>
        <Libelle className="mb-3">1 · Seconde fraction</Libelle>
        <GlassCard className="p-5">
          <p className="text-xs leading-relaxed text-slate-700">
            C’est la fraction qui décide de la qualité de l’examen : elle nettoie le côlon droit, là où se cachent
            les adénomes plans. Elle doit être <span className="font-medium text-navy">terminée 2 heures avant l’induction</span>.
          </p>
          <p className="mt-2.5 text-xs text-slate-600">{protocole.volumeFraction} — {protocole.eauClaireApres}</p>
          <div className="mt-4 space-y-2.5">
            <CarteChoix
              actif={tolerance === 'COMPLETE'} onClick={dejaFait ? () => {} : () => setTolerance('COMPLETE')}
              ton="emerald" titre="Fraction 2 intégralement bue" detail="Volume complet, sans rejet."
            />
            <CarteChoix
              actif={tolerance === 'PARTIELLE'} onClick={dejaFait ? () => {} : () => setTolerance('PARTIELLE')}
              ton="amber" titre="Partiellement bue" detail="Nausées, volume incomplet."
            />
          </div>
        </GlassCard>
      </section>

      <section>
        <Libelle className="mb-2 flex items-center gap-1.5"><Eye size={13} /> 2 · Aspect de vos dernières selles</Libelle>
        <p className="mb-3 text-xs leading-relaxed text-slate-600">
          Regardez la cuvette après votre dernier passage et choisissez l’image la plus ressemblante.
          C’est cette réponse qui prédit le mieux la qualité réelle de l’examen.
        </p>
        <div className="space-y-2.5">
          {ECHELLE_EVACUATION.map((item) => (
            <CarteEvacuation
              key={item.id}
              item={item}
              actif={evac === item.id}
              verrouille={dejaFait}
              onClick={() => setEvac(item.id)}
            />
          ))}
        </div>
      </section>

      {insuffisant ? (
        <GlassCard glow="ruby" className="p-5 rise">
          <p className="flex items-center gap-2 text-sm font-semibold text-rose-700">
            <AlertTriangle size={16} /> Votre préparation n’est pas encore aboutie
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-700">
            Continuez à boire de l’eau claire — sans dépasser l’heure limite de jeûne — et restez joignable.
            L’équipe est alertée : selon l’évolution, un lavement de secours sera prescrit à votre arrivée,
            ou votre passage sera décalé en fin de programme pour laisser agir la préparation.
          </p>
        </GlassCard>
      ) : choisi ? (
        <GlassCard glow="emerald" className="p-5 rise">
          <p className="text-sm font-semibold text-emerald-700">{choisi.verdict}</p>
          <p className="mt-1.5 text-xs text-slate-600">Score de Boston {choisi.boston} — muqueuse analysable.</p>
        </GlassCard>
      ) : null}
    </Coque>
  );
}
