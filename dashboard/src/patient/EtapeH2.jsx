import { useState } from 'react';
import { Ban, Cigarette, PenLine, ShieldCheck, AlertTriangle } from '../components/icones.js';
import GlassCard from '../components/GlassCard.jsx';
import { Bouton, CarteChoix, Libelle } from '../components/ui.jsx';
import { ETAPES } from '../lib/protocols.js';
import { store } from '../lib/store.js';
import Coque from './Coque.jsx';

const ETAPE = ETAPES[4];

export default function EtapeH2({ patient, onFermer }) {
  const dejaFait = patient.etapes.h2.done;
  const [jeune, setJeune] = useState(patient.etapes.h2.jeuneSigne ?? false);
  const [tabac, setTabac] = useState(patient.etapes.h2.tabac ?? null);

  const induction = new Date(patient.heureInduction);
  const limite = new Date(induction.getTime() - 2 * 3600 * 1000);
  const hLimite = limite.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  function valider() {
    store.majEtape(
      patient.id, 'h2',
      { jeuneSigne: jeune, tabac, heureDernierApport: limite.toISOString() },
      tabac ? 'Tabagisme déclaré dans les 2 h — MAR à prévenir' : 'Jeûne certifié, signature horodatée',
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
          <Bouton ton={tabac ? 'amber' : 'emerald'} disabled={!jeune || tabac === null} onClick={valider} className="w-full">
            <PenLine size={16} /> Signer mon engagement
          </Bouton>
        )
      }
    >
      <GlassCard glow="ruby" className="p-6">
        <p className="flex items-center gap-2 text-sm font-semibold text-rose-700">
          <Ban size={16} /> Arrêt total depuis {hLimite}
        </p>
        <p className="mt-2.5 text-xs leading-relaxed text-slate-700">
          Plus rien à boire, plus rien à manger, plus de cigarette. Un estomac non vide sous propofol expose à
          l’inhalation du contenu gastrique dans les poumons — le syndrome de Mendelson.
          <span className="font-medium text-navy"> L’anesthésiste annulera l’examen sur table</span> au moindre doute.
        </p>
      </GlassCard>

      <section>
        <Libelle className="mb-3 flex items-center gap-1.5"><Cigarette size={13} /> Tabac</Libelle>
        <p className="mb-3 text-xs leading-relaxed text-slate-600">
          Beaucoup de patients l’ignorent : fumer stimule la sécrétion acide et retarde la vidange de l’estomac.
          Une cigarette compte autant qu’un repas. Répondez franchement, cela ne vous sera pas reproché.
        </p>
        <div className="space-y-2.5">
          <CarteChoix
            actif={tabac === false} onClick={dejaFait ? () => {} : () => setTabac(false)}
            ton="emerald" titre="Je n’ai pas fumé" detail={`Aucune cigarette depuis ${hLimite}.`}
          />
          <CarteChoix
            actif={tabac === true} onClick={dejaFait ? () => {} : () => setTabac(true)}
            ton="ruby" titre="J’ai fumé" detail="Signalez-le : l’anesthésiste adaptera sa technique."
          />
        </div>
      </section>

      {tabac ? (
        <GlassCard glow="amber" className="p-5 rise">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-700">
            <AlertTriangle size={15} /> Information transmise au MAR
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-700">
            Ne fumez plus jusqu’à l’examen. L’anesthésiste en tiendra compte : induction séquence rapide,
            ou décalage de votre passage pour prolonger le jeûne.
          </p>
        </GlassCard>
      ) : null}

      <section>
        <Libelle className="mb-3">Engagement sur l’honneur</Libelle>
        <button
          type="button"
          disabled={dejaFait}
          onClick={() => setJeune(!jeune)}
          aria-pressed={jeune}
          className={`w-full rounded-xl border p-5 text-left transition-all duration-200 disabled:cursor-default ${
            jeune ? 'border-emerald-500/30 bg-emerald-500/[0.08]' : 'border-navy/[0.09] bg-white/55 hover:border-navy/20'
          }`}
        >
          <p className="text-sm leading-relaxed text-slate-800">
            « Je certifie être <span className="font-semibold text-navy">à jeun strict depuis {hLimite}</span> :
            je n’ai rien bu, rien mangé, et je n’ai pas fumé. »
          </p>
          <p className={`mt-3.5 flex items-center gap-2 text-xs font-medium ${jeune ? 'text-emerald-700' : 'text-slate-600'}`}>
            <ShieldCheck size={14} />
            {jeune
              ? `Signé le ${new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
              : 'Touchez pour signer'}
          </p>
        </button>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          Signature horodatée et versée à votre fiche d’anesthésie. Elle ne remplace pas l’interrogatoire
          du MAR avant l’induction.
        </p>
      </section>
    </Coque>
  );
}
