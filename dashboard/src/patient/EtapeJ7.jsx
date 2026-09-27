import { useState } from 'react';
import { Pill, HeartPulse, AlertTriangle, Check } from '../components/icones.js';
import GlassCard from '../components/GlassCard.jsx';
import { Bascule, Bouton, CarteChoix, Libelle } from '../components/ui.jsx';
import { ANTICOAGULANTS, ETAPES } from '../lib/protocols.js';
import { store } from '../lib/store.js';
import Coque from './Coque.jsx';

const ETAPE = ETAPES[0];

export default function EtapeJ7({ patient, protocole, onFermer }) {
  const dejaFait = patient.etapes.j7.done;
  const [purge, setPurge] = useState(patient.etapes.j7.purgeRecuperee ?? false);
  const [antico, setAntico] = useState(patient.etapes.j7.anticoagulant ?? null);
  const [consigne, setConsigne] = useState(patient.etapes.j7.consigneArret ?? null);

  const choisi = ANTICOAGULANTS.find((a) => a.id === antico);
  const besoinConsigne = choisi && choisi.id !== 'AUCUN';
  const complet = purge !== null && antico !== null && (!besoinConsigne || consigne !== null);
  // Le cas qui coûte un bloc : patient anticoagulé, aucune consigne d'arrêt reçue.
  const enPeril = besoinConsigne && consigne === false;

  function valider() {
    store.majEtape(
      patient.id, 'j7',
      { purgeRecuperee: purge, anticoagulant: antico, anticoagulantLabel: choisi.label, consigneArret: besoinConsigne ? consigne : null },
      enPeril ? 'Anticoagulant déclaré sans consigne d’arrêt' : 'Logistique J-7 confirmée',
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
          <Bouton ton={enPeril ? 'amber' : 'emerald'} disabled={!complet} onClick={valider} className="w-full">
            <Check size={16} /> Valider mes deux actions
          </Bouton>
        )
      }
    >
      <section>
        <Libelle className="mb-3 flex items-center gap-1.5"><Pill size={13} /> 1 · Votre préparation</Libelle>
        <GlassCard className="p-5">
          <p className="text-sm text-slate-700">
            Votre ordonnance mentionne <span className="font-semibold text-navy">{protocole.nom}</span> — {protocole.famille}.
          </p>
          <div className="mt-4">
            <Bascule
              actif={purge}
              onChange={dejaFait ? () => {} : setPurge}
              label="J’ai récupéré ma préparation"
              detail="La pharmacie doit l’avoir en stock : anticipez, certaines commandent sous 48 h."
            />
          </div>
        </GlassCard>
      </section>

      <section>
        <Libelle className="mb-3 flex items-center gap-1.5"><HeartPulse size={13} /> 2 · Vos fluidifiants sanguins</Libelle>
        <p className="mb-3 text-xs leading-relaxed text-slate-600">
          Si un polype est retiré pendant l’examen, un traitement anticoagulant non interrompu expose à une hémorragie digestive.
          Sélectionnez ce que vous prenez.
        </p>
        <div className="space-y-2.5">
          {ANTICOAGULANTS.map((a) => (
            <CarteChoix
              key={a.id}
              actif={antico === a.id}
              onClick={dejaFait ? () => {} : () => { setAntico(a.id); setConsigne(null); }}
              ton={a.risque === 'majeur' ? 'amber' : 'marque'}
              titre={a.label}
              detail={a.classe ? `${a.classe} — ${a.delai}` : 'Aucun traitement fluidifiant'}
            />
          ))}
        </div>
      </section>

      {besoinConsigne ? (
        <section className="rise">
          <Libelle className="mb-3">3 · Votre consigne d’arrêt</Libelle>
          <div className="space-y-2.5">
            <CarteChoix
              actif={consigne === true}
              onClick={dejaFait ? () => {} : () => setConsigne(true)}
              ton="emerald"
              titre="J’ai une consigne d’arrêt écrite"
              detail="Votre médecin vous a indiqué une date et une modalité précises."
            />
            <CarteChoix
              actif={consigne === false}
              onClick={dejaFait ? () => {} : () => setConsigne(false)}
              ton="ruby"
              titre="Je n’ai reçu aucune consigne"
              detail="Ne modifiez rien de vous-même. Nous vous rappelons."
            />
          </div>

          {enPeril ? (
            <GlassCard glow="ruby" className="mt-4 p-5 rise pulse-ruby">
              <p className="flex items-center gap-2 text-sm font-semibold text-rose-700">
                <AlertTriangle size={16} /> N’arrêtez rien de votre propre initiative
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-700">
                Interrompre un anticoagulant sans avis médical expose à une thrombose ou à un AVC.
                Votre déclaration est transmise immédiatement au secrétariat d’endoscopie, qui vous rappelle
                pour fixer la conduite à tenir avec votre cardiologue.
              </p>
            </GlassCard>
          ) : null}
        </section>
      ) : null}
    </Coque>
  );
}
