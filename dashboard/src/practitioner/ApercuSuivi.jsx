import { useState } from 'react';
import { MessageSquare, Eye, ShieldCheck, Clock } from '../components/icones.js';
import Jalon from '../components/Jalon.jsx';
import { useDossiers } from '../lib/store.js';
import { EXAMENS, ANESTHESIES, etapesDe, poidsDe } from '../lib/examens.js';
import { planSms } from '../lib/sms.js';
import { heure, jourCourt } from '../lib/patient.js';
import { EnTete } from './Coquille.jsx';

/**
 * Aperçu du suivi.
 *
 * Il répond à une question que ni le tableau de bord ni l'échéancier ne
 * traitent : qu'est-ce que le patient reçoit, exactement, et quand. Sur un
 * dossier réel, on ne voit jamais la séquence entière — seulement l'étape du
 * jour. Ici elle est déroulée d'un bout à l'autre, avec le texte véritable des
 * messages, rédigé par le même code que les envois.
 *
 * Le dossier affiché est fictif, et l'écran le dit. Il porte le nom et le
 * téléphone du cabinet connecté : ce qu'on lit est ce qui partirait.
 */

/** Un dossier d'exemple, daté à trois semaines, pour dérouler la séquence. */
function dossierExemple(type) {
  const ex = EXAMENS[type];
  const date = new Date();
  date.setDate(date.getDate() + 21);
  date.setHours(9, 0, 0, 0);
  return {
    id: 'apercu',
    token: 'xxxxxxxxxxxxxxxx',
    numero: 'GE-0000-0000',
    identite: { nom: 'Exemple', prenom: 'Patient', naissance: '1970-01-01', telephone: '' },
    examen: {
      type,
      date: date.toISOString(),
      anesthesie: ex.anesthesie,
      schema: 'FRACTIONNE',
      renforce: false,
      protocole: ex.purge ? 'MOVIPREP' : null,
      lieu: 'votre plateau d’endoscopie',
      operateur: '',
    },
    terrain: { traitements: [], facteurs: [], comorbidites: [] },
    administratif: {},
    etapes: {},
    evenements: [],
  };
}

export default function ApercuSuivi() {
  const { cabinet } = useDossiers();
  const [type, setType] = useState('COLO');

  const patient = dossierExemple(type);
  const examen = EXAMENS[type];
  const etapes = etapesDe(patient);
  const poids = poidsDe(patient);
  const plan = planSms(patient, cabinet, new Date(0));
  const jourJ = new Date(patient.examen.date);

  return (
    <>
      <EnTete
        titre="Aperçu du suivi"
        question="Ce que le patient reçoit, message par message, de la première consigne au jour de l’examen."
      />

      <div className="px-5 pb-10 pt-6 sm:px-8">
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
          Sur un dossier réel, on ne voit jamais la séquence entière — seulement l’étape du jour.
          Elle est déroulée ici d’un bout à l’autre, sur un dossier fictif daté dans trois semaines.
          Les messages sont rédigés par le même code que les envois : ce que vous lisez est ce qui partirait,
          avec le nom et le téléphone de votre cabinet.
        </p>

        <div className="mt-6">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Choisissez un examen — l’échéancier en découle
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.values(EXAMENS).map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setType(e.id)}
                aria-pressed={type === e.id}
                className={`rounded-xl border px-3.5 py-2 text-xs font-medium transition-colors ${
                  type === e.id
                    ? 'border-navy/40 bg-navy/[0.08] font-semibold text-navy'
                    : 'border-navy/[0.09] bg-white/70 text-slate-700 hover:bg-white'
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl border border-navy/[0.07] bg-white/60 px-4 py-3 text-[11px] text-slate-600">
          <span><span className="font-semibold text-navy">{etapes.length}</span> messages</span>
          <span><span className="font-semibold text-navy">{examen.preparation}</span></span>
          <span><span className="font-semibold text-navy">{ANESTHESIES[examen.anesthesie].label}</span> par défaut</span>
          <span>Examen le <span className="font-semibold text-navy">{jourCourt(jourJ)} à {heure(jourJ)}</span></span>
        </div>

        {/* La séquence. Un filet continu relie les jalons : c'est un compte à rebours. */}
        <ol className="relative mt-8 space-y-4 before:absolute before:bottom-6 before:left-[1.35rem] before:top-6 before:w-px before:bg-navy/10">
          {plan.map((sms) => {
            const etape = sms.etape;
            const ecran = !etape.informatif;
            return (
              <li key={etape.id} className="relative flex gap-4">
                <span className="relative z-10 mt-1 shrink-0">
                  <Jalon taille="s">{sms.cle}</Jalon>
                </span>

                <div className="min-w-0 flex-1 rounded-2xl border border-navy/[0.07] bg-white/60 p-4 backdrop-blur-2xl">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="text-sm font-bold text-navy">{etape.titre}</p>
                    <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Clock size={12} /> {jourCourt(sms.envoi)} à {heure(sms.envoi)}
                      {poids[etape.id] ? <span className="text-slate-400">· {poids[etape.id]} pts sur 100</span> : null}
                    </p>
                  </div>

                  {/* Le message, tel qu'il arrive sur le téléphone. */}
                  <div className="mt-3 rounded-xl rounded-tl-sm border border-navy/[0.07] bg-navy/[0.03] px-4 py-3">
                    <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      <MessageSquare size={11} /> SMS de {cabinet.expediteur}
                    </p>
                    <p className="text-sm leading-relaxed text-slate-800">{sms.texte}</p>
                  </div>

                  <p className="mt-3 text-[11px] leading-relaxed text-slate-600">{etape.pourquoi}</p>

                  <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                    <Eye size={12} />
                    {ecran
                      ? 'Le patient ouvre le lien, répond, et sa réponse remonte au cabinet.'
                      : 'Message d’information : aucune réponse attendue.'}
                  </p>
                </div>
              </li>
            );
          })}

          {/* Le jour J ferme la séquence : Endova est un outil préopératoire. */}
          <li className="relative flex gap-4">
            <span className="relative z-10 mt-1 shrink-0">
              <Jalon taille="s" ton="plein">J-J</Jalon>
            </span>
            <div className="min-w-0 flex-1 rounded-2xl border border-navy/20 bg-navy/[0.04] p-4">
              <p className="text-sm font-bold text-navy">{examen.label}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                {jourCourt(jourJ)} à {heure(jourJ)}. Le suivi s’arrête ici : ce qui suit l’examen
                appartient à l’équipe d’endoscopie.
              </p>
            </div>
          </li>
        </ol>

        <p className="mt-8 flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
          <ShieldCheck size={13} className="mt-0.5 shrink-0" />
          Les consignes cliniques doivent être relues et validées par le prescripteur avant toute mise en service.
        </p>
      </div>
    </>
  );
}
