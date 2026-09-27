import { useEffect, useRef, useState } from 'react';
import { GlassWater, Timer, Check, AlertTriangle, Zap, Droplets } from '../components/icones.js';
import GlassCard from '../components/GlassCard.jsx';
import { Bouton, CarteChoix, Libelle, AnneauScore } from '../components/ui.jsx';
import { ETAPES } from '../lib/protocols.js';
import { store } from '../lib/store.js';
import Coque from './Coque.jsx';

const ETAPE = ETAPES[2];
/** Le minuteur réel est de 15 min entre deux verres. Accéléré ici pour être démontrable. */
const VITESSE_DEMO = 120;

function mmss(s) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export default function EtapeJ1({ patient, protocole, onFermer }) {
  const dejaFait = patient.etapes.j1.done;
  const total = protocole.verres;
  const intervalle = protocole.intervalleMin * 60;

  const [bus, setBus] = useState(dejaFait ? (patient.etapes.j1.verresBus ?? total) : 0);
  const [restant, setRestant] = useState(0);
  const [tolerance, setTolerance] = useState(patient.etapes.j1.tolerance ?? null);
  const tick = useRef(null);

  // Décompte entre deux verres : la nausée vient d'une ingestion trop rapide.
  useEffect(() => {
    if (restant <= 0) return undefined;
    tick.current = setInterval(() => setRestant((r) => Math.max(0, r - 1)), 1000 / VITESSE_DEMO);
    return () => clearInterval(tick.current);
  }, [restant > 0]);

  const fini = bus >= total;
  const enAttente = restant > 0;

  function boire() {
    const n = bus + 1;
    setBus(n);
    if (n < total) setRestant(intervalle);
  }

  function valider() {
    store.majEtape(
      patient.id, 'j1',
      { tolerance, verresBus: bus },
      tolerance === 'VOMI' ? 'Rejet de la fraction 1 — compensation déclenchée'
        : tolerance === 'PARTIELLE' ? 'Fraction 1 partiellement ingérée'
        : 'Fraction 1 complète et tolérée',
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
        dejaFait ? null : fini ? (
          <Bouton ton={tolerance === 'VOMI' ? 'amber' : 'emerald'} disabled={!tolerance} onClick={valider} className="w-full">
            <Check size={16} /> Enregistrer ma prise
          </Bouton>
        ) : null
      }
    >
      <GlassCard deep className="p-6">
        <div className="flex items-center gap-5">
          <AnneauScore valeur={(bus / total) * 100} ton={fini ? 'emerald' : 'marque'} taille={104} epaisseur={8}>
            <span className="text-2xl font-bold text-navy">{bus}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-600">/ {total} verres</span>
          </AnneauScore>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-navy">{protocole.nom}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{protocole.volumeFraction}</p>
            <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-magenta">
              <Timer size={12} /> 1 verre toutes les {protocole.intervalleMin} minutes
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                i < bus ? 'bg-emerald-500' : 'bg-navy/8'
              }`}
            />
          ))}
        </div>
      </GlassCard>

      {!dejaFait && !fini ? (
        enAttente ? (
          <GlassCard glow="amber" className="p-6 text-center rise">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">Pause imposée</p>
            <p className="mt-3 font-mono text-4xl font-bold tabular-nums text-navy">{mmss(restant)}</p>
            <p className="mt-3 text-xs leading-relaxed text-slate-700">
              Ne prenez pas d’avance. Boire trop vite est la première cause de vomissement,
              et un vomissement fait perdre le volume déjà ingéré.
            </p>
            <p className="mt-3 inline-flex items-center gap-1 rounded-full border border-navy/[0.09] bg-white/55 px-2.5 py-1 text-[10px] text-slate-600">
              <Zap size={10} className="text-amber-700" /> Démo accélérée ×{VITESSE_DEMO}
            </p>
          </GlassCard>
        ) : (
          <button
            type="button"
            onClick={boire}
            className="group w-full rounded-2xl border border-magenta/30 bg-magenta/[0.07] p-7 text-center shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-2xl transition-all duration-300 hover:bg-magenta/[0.12] active:scale-[0.98] rise"
          >
            <GlassWater size={30} className="mx-auto text-magenta transition-transform group-hover:scale-110" />
            <p className="mt-3 text-base font-semibold text-navy">J’ai bu le verre {bus + 1}</p>
            <p className="mt-1.5 text-xs text-slate-600">Lentement, par petites gorgées, sans vous forcer</p>
          </button>
        )
      ) : null}

      {fini ? (
        <>
          <GlassCard glow="emerald" className="p-5 rise">
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <Droplets size={15} /> Fraction terminée — passez à l’eau claire
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-700">{protocole.eauClaireApres}</p>
          </GlassCard>

          <section>
            <Libelle className="mb-3">Comment l’avez-vous supporté ?</Libelle>
            <div className="space-y-2.5">
              <CarteChoix
                actif={tolerance === 'COMPLETE'} onClick={dejaFait ? () => {} : () => setTolerance('COMPLETE')}
                ton="emerald" titre="J’ai tout bu, sans vomir"
                detail="Volume complet ingéré et conservé."
              />
              <CarteChoix
                actif={tolerance === 'PARTIELLE'} onClick={dejaFait ? () => {} : () => setTolerance('PARTIELLE')}
                ton="amber" titre="J’ai eu des nausées, je n’ai pas tout fini"
                detail="Une partie du volume manque."
              />
              <CarteChoix
                actif={tolerance === 'VOMI'} onClick={dejaFait ? () => {} : () => setTolerance('VOMI')}
                ton="ruby" titre="J’ai vomi une bonne partie du produit"
                detail="Le volume rejeté ne lave pas le côlon."
              />
            </div>
          </section>

          {tolerance === 'VOMI' ? (
            <GlassCard glow="ruby" className="p-5 rise">
              <p className="flex items-center gap-2 text-sm font-semibold text-rose-700">
                <AlertTriangle size={16} /> Protocole de compensation
              </p>
              <ol className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-700">
                <li className="flex gap-2.5"><span className="font-bold text-rose-700">1.</span> Arrêtez la purge et attendez 30 minutes, au calme, sans rien boire.</li>
                <li className="flex gap-2.5"><span className="font-bold text-rose-700">2.</span> Prenez l’antiémétique prescrit si vous en avez un (métoclopramide, dompéridone).</li>
                <li className="flex gap-2.5"><span className="font-bold text-rose-700">3.</span> Reprenez ensuite par petites gorgées, verre glacé, avec une paille.</li>
                <li className="flex gap-2.5"><span className="font-bold text-rose-700">4.</span> Le secrétariat est alerté et vous rappelle pour adapter la suite.</li>
              </ol>
              <p className="mt-3 text-[11px] text-slate-600">
                N’abandonnez pas la préparation de vous-même : un côlon non préparé fait annuler l’examen sur table.
              </p>
            </GlassCard>
          ) : null}
        </>
      ) : null}
    </Coque>
  );
}
