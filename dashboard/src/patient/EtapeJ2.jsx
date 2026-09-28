import { useState } from 'react';
import { Check, HeartPulse, Stethoscope, AlertTriangle } from '../components/icones.js';
import GlassCard from '../components/GlassCard.jsx';
import { Bouton, CarteChoix, Libelle } from '../components/ui.jsx';
import { ETAPES } from '../lib/examens.js';
import { traitement } from '../lib/terrain.js';
import { anesthesieDe } from '../lib/patient.js';
import { store } from '../lib/store.js';
import Coque from './Coque.jsx';

/**
 * J-2 : le moment où les arrêts doivent être effectifs. À J-7 le patient a dit
 * avoir reçu ses consignes ; ici il confirme les avoir suivies. Un anticoagulant
 * direct s'arrête 48 h avant : c'est aujourd'hui qu'on le vérifie, pas demain.
 */
export default function EtapeJ2({ patient, onFermer }) {
  const d = patient.etapes.j2 ?? {};
  const dejaFait = Boolean(d.done);
  const aVerifier = (patient.terrain.traitements ?? []).map(traitement).filter((t) => t?.controle);
  const cpaRequise = anesthesieDe(patient).cpa;

  const [reponses, setReponses] = useState(d.traitements ?? {});
  const [cpa, setCpa] = useState(d.cpa ?? null);
  const figer = (fn) => (dejaFait ? () => {} : fn);

  const complet = aVerifier.every((t) => typeof reponses[t.id] === 'boolean') && (!cpaRequise || cpa !== null);
  const probleme = aVerifier.some((t) => t.critique && reponses[t.id] === false) || cpa === false;

  return (
    <Coque
      etape={ETAPES.j2}
      patient={patient}
      onFermer={onFermer}
      lecture={dejaFait}
      pied={dejaFait ? null : (
        <Bouton
          ton={probleme ? 'amber' : 'emerald'}
          disabled={!complet}
          onClick={() => { store.majEtape(patient.id, 'j2', { traitements: reponses, cpa: cpaRequise ? cpa : null }); onFermer(); }}
          className="w-full"
        >
          <Check size={16} /> Confirmer au cabinet
        </Bouton>
      )}
    >
      {aVerifier.length ? (
        <section>
          <Libelle className="mb-3 flex items-center gap-1.5"><HeartPulse size={13} /> Vos traitements</Libelle>
          <div className="space-y-4">
            {aVerifier.map((t) => (
              <GlassCard key={t.id} className="p-5">
                <p className="text-sm font-semibold text-navy">{t.label}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{t.exemples}</p>
                <p className="mt-3 text-sm text-slate-800">{t.controle}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <CarteChoix actif={reponses[t.id] === true} onClick={figer(() => setReponses({ ...reponses, [t.id]: true }))} ton="emerald" titre="Oui" />
                  <CarteChoix actif={reponses[t.id] === false} onClick={figer(() => setReponses({ ...reponses, [t.id]: false }))} ton={t.critique ? 'ruby' : 'amber'} titre="Non" />
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      ) : null}

      {cpaRequise ? (
        <section>
          <Libelle className="mb-3 flex items-center gap-1.5"><Stethoscope size={13} /> Votre anesthésie</Libelle>
          <p className="mb-3 text-xs leading-relaxed text-slate-600">La consultation avec l’anesthésiste est obligatoire au moins 48 heures avant l’examen.</p>
          <div className="space-y-2.5">
            <CarteChoix actif={cpa === true} onClick={figer(() => setCpa(true))} ton="emerald" titre="J’ai vu l’anesthésiste" />
            <CarteChoix actif={cpa === false} onClick={figer(() => setCpa(false))} ton="ruby" titre="Pas encore" detail="Le cabinet vous rappelle pour trouver un créneau." />
          </div>
        </section>
      ) : null}

      {!aVerifier.length && !cpaRequise ? (
        <GlassCard className="p-5">
          <p className="text-sm text-slate-700">Aucun traitement à arrêter pour votre examen. Confirmez simplement que tout est prêt.</p>
        </GlassCard>
      ) : null}

      {probleme ? (
        <GlassCard glow="ruby" className="p-5 rise">
          <p className="flex items-center gap-2 text-sm font-semibold text-rose-700"><AlertTriangle size={16} /> Le cabinet est prévenu</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-700">
            Votre réponse part tout de suite au secrétariat, qui vous rappelle aujourd’hui. Ne modifiez rien de vous-même d’ici là.
          </p>
        </GlassCard>
      ) : null}
    </Coque>
  );
}
