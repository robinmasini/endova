import { useState } from 'react';
import { Pill, HeartPulse, AlertTriangle, Check, UsersRound } from '../components/icones.js';
import GlassCard from '../components/GlassCard.jsx';
import { Bascule, Bouton, CarteChoix, Libelle } from '../components/ui.jsx';
import { ETAPES } from '../lib/examens.js';
import { traitement } from '../lib/terrain.js';
import { examenDe, anesthesieDe } from '../lib/patient.js';
import { store } from '../lib/store.js';
import Coque from './Coque.jsx';

const ETAPE = ETAPES.j7;

export default function EtapeJ7({ patient, protocole, onFermer }) {
  const d = patient.etapes.j7 ?? {};
  const dejaFait = Boolean(d.done);
  const purge = examenDe(patient).purge;
  const accompagnantRequis = anesthesieDe(patient).accompagnant;
  // On n'interroge que sur les traitements qui appellent une consigne : l'aspirine se poursuit.
  const aVerifier = (patient.terrain.traitements ?? []).map(traitement).filter((t) => t?.question);

  const [recuperee, setRecuperee] = useState(d.purgeRecuperee ?? false);
  const [reponses, setReponses] = useState(d.traitements ?? {});
  const [accompagnant, setAccompagnant] = useState(d.accompagnant ?? null);

  const complet = aVerifier.every((t) => typeof reponses[t.id] === 'boolean') && (!accompagnantRequis || accompagnant !== null);
  const sansConsigne = aVerifier.filter((t) => t.critique && reponses[t.id] === false);
  const n = (i) => i + (purge ? 1 : 0);

  function valider() {
    store.majEtape(patient.id, 'j7', {
      purgeRecuperee: purge ? recuperee : null,
      traitements: reponses,
      accompagnant: accompagnantRequis ? accompagnant : null,
    });
    onFermer();
  }

  const figer = (fn) => (dejaFait ? () => {} : fn);

  return (
    <Coque
      etape={ETAPE}
      patient={patient}
      onFermer={onFermer}
      lecture={dejaFait}
      pied={
        dejaFait ? null : (
          <Bouton ton={sansConsigne.length ? 'amber' : 'emerald'} disabled={!complet} onClick={valider} className="w-full">
            <Check size={16} /> Transmettre au cabinet
          </Bouton>
        )
      }
    >
      {purge ? (
        <section>
          <Libelle className="mb-3 flex items-center gap-1.5"><Pill size={13} /> 1 · Votre préparation</Libelle>
          <GlassCard className="p-5">
            <p className="text-sm text-slate-700">
              Votre ordonnance mentionne <span className="font-semibold text-navy">{protocole.nom}</span> — {protocole.famille}.
            </p>
            <div className="mt-4">
              <Bascule
                actif={recuperee}
                onChange={figer(setRecuperee)}
                label="J’ai récupéré ma préparation"
                detail="Certaines pharmacies la commandent sous 48 h : anticipez."
              />
            </div>
          </GlassCard>
        </section>
      ) : null}

      <section>
        <Libelle className="mb-3 flex items-center gap-1.5"><HeartPulse size={13} /> {n(1)} · Vos traitements</Libelle>
        {aVerifier.length ? (
          <div className="space-y-4">
            {aVerifier.map((t) => (
              <GlassCard key={t.id} className="p-5">
                <p className="text-sm font-semibold text-navy">{t.label}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{t.exemples}</p>
                <p className="mt-3 text-sm text-slate-800">{t.question}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <CarteChoix actif={reponses[t.id] === true} onClick={figer(() => setReponses({ ...reponses, [t.id]: true }))} ton="emerald" titre="Oui" />
                  <CarteChoix actif={reponses[t.id] === false} onClick={figer(() => setReponses({ ...reponses, [t.id]: false }))} ton={t.critique ? 'ruby' : 'amber'} titre="Non" />
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <GlassCard className="p-5">
            <p className="text-sm text-slate-700">Votre médecin n’a noté aucun traitement à adapter avant l’examen.</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Si vous prenez un anticoagulant, un antiagrégant, une injection pour le diabète ou le poids, ou du fer,
              appelez le cabinet avant de continuer.
            </p>
          </GlassCard>
        )}

        {sansConsigne.length ? (
          <GlassCard glow="ruby" className="mt-4 p-5 rise pulse-ruby">
            <p className="flex items-center gap-2 text-sm font-semibold text-rose-700">
              <AlertTriangle size={16} /> N’arrêtez rien de votre propre initiative
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-700">
              Interrompre certains traitements sans avis médical est dangereux. Votre réponse est transmise au cabinet,
              qui vous rappelle avec une consigne écrite.
            </p>
          </GlassCard>
        ) : null}
      </section>

      {accompagnantRequis ? (
        <section>
          <Libelle className="mb-3 flex items-center gap-1.5"><UsersRound size={13} /> {n(2)} · Votre retour</Libelle>
          <p className="mb-3 text-xs leading-relaxed text-slate-600">
            Après l’anesthésie, vous ne pourrez ni conduire ni rentrer seul, même en taxi.
          </p>
          <div className="space-y-2.5">
            <CarteChoix actif={accompagnant === true} onClick={figer(() => setAccompagnant(true))} ton="emerald" titre="Quelqu’un viendra me chercher" />
            <CarteChoix actif={accompagnant === false} onClick={figer(() => setAccompagnant(false))} ton="amber" titre="Je n’ai personne pour l’instant" detail="Le cabinet vous aidera à trouver une solution." />
          </div>
        </section>
      ) : null}
    </Coque>
  );
}
