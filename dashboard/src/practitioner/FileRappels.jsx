import { Link } from 'react-router-dom';
import { PhoneCall, AlertTriangle, CheckCircle2 } from '../components/icones.js';
import { alertesActives } from '../lib/score.js';
import { examenDe, heure, echeance, nomComplet } from '../lib/patient.js';
import { TONS } from '../components/ui.jsx';

/**
 * Ce que le secrétariat doit dire au téléphone, motif par motif.
 * Sans cette phrase, chaque rappel se rejoue de mémoire et perd en précision.
 */
const SCRIPTS = {
  PURGE_CONTRE_INDIQUEE:
    'Le médecin a revu votre préparation : ne prenez pas celle qui vous a été prescrite. Une nouvelle ordonnance vous attend au cabinet.',
  TRAITEMENT_AOD:
    'Ne modifiez surtout pas votre traitement vous-même. Nous vérifions avec votre médecin et nous vous envoyons la consigne d’arrêt par écrit.',
  TRAITEMENT_AVK:
    'Ne modifiez rien vous-même. Nous vous envoyons la consigne d’arrêt et l’ordonnance pour la prise de sang de contrôle la veille.',
  TRAITEMENT_P2Y12:
    'Ne l’arrêtez pas sans l’accord de votre cardiologue. Nous le contactons et nous vous rappelons avec sa réponse.',
  TRAITEMENT_GLP1:
    'Votre injection peut ralentir la digestion. Nous prévenons l’anesthésiste ; la veille, ne prenez que des liquides clairs.',
  TRAITEMENT_SGLT2:
    'Arrêtez ce comprimé dès aujourd’hui et jusqu’à l’examen : avec le jeûne, il peut provoquer un malaise grave.',
  TRAITEMENT_INSULINE:
    'La veille et le matin de l’examen, vos doses doivent être réduites. Je vous lis la consigne du médecin.',
  TRAITEMENT_FER:
    'Arrêtez votre fer dès maintenant : il colle à la paroi de l’intestin et gêne l’examen.',
  PURGE_ABSENTE:
    'Votre préparation doit être récupérée en pharmacie aujourd’hui. Si elle n’est pas en stock, rappelez-nous : nous trouverons une alternative.',
  ACCOMPAGNANT:
    'Après l’anesthésie, vous ne pourrez ni conduire ni rentrer seul. Avez-vous quelqu’un pour venir vous chercher ?',
  GLP1_ANESTHESISTE:
    'Nous prévenons l’anesthésiste de votre traitement. La veille de l’examen, ne prenez que des liquides clairs.',
  CPA:
    'La consultation d’anesthésie est obligatoire avant l’examen. Je vous propose un rendez-vous dès que possible.',
  CONSENTEMENT:
    'Pensez à apporter le formulaire de consentement signé le jour de l’examen.',
  LIEN_NON_OUVERT:
    'Vous avez reçu nos SMS pour préparer votre examen ? Je vérifie votre numéro et je vous les renvoie.',
  ECART_REGIME:
    'Reprenez le régime sans résidu strict dès maintenant. Pas de graines, pas de peaux, pas de fibres jusqu’à l’examen.',
  VOMISSEMENT_PURGE:
    'Faites une pause de 30 minutes, prenez l’antiémétique si vous en avez, puis reprenez par petites gorgées, frais, avec une paille. N’abandonnez pas la préparation.',
  EVACUATION_INSUFFISANTE:
    'Continuez les liquides clairs jusqu’à l’heure limite. Présentez-vous à l’heure : un lavement sera fait à l’arrivée si nécessaire.',
  TABAC_H2:
    'Ne fumez plus jusqu’à l’examen. Nous prévenons l’anesthésiste.',
  JEUNE_NON_SIGNE:
    'Confirmez-moi l’heure de votre dernière prise alimentaire ou de boisson. C’est indispensable avant l’anesthésie.',
  GLP1_REPAS:
    'Ne mangez plus rien. Nous prévenons l’anesthésiste, qui décidera de l’heure de votre passage.',
  LAVEMENTS_ABSENTS:
    'Il vous faut deux lavements pour demain matin. Je vous indique la pharmacie de garde la plus proche.',
  LAVEMENT_INEFFICACE:
    'Présentez-vous à l’heure prévue : un lavement complémentaire sera fait sur place.',
};

function Carte({ patient, motifs }) {
  const urgent = motifs.some((m) => m.ton === 'ruby');

  return (
    <article
      className={`rounded-xl border p-4 ${
        urgent ? 'border-rose-400/50 bg-rose-50/60' : 'border-amber-400/50 bg-amber-50/50'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-navy">
            {nomComplet(patient)}
          </p>
          <p className="mt-0.5 text-xs text-slate-600">
            {examenDe(patient).label} {echeance(patient)} à {heure(patient.examen.date)}
            {' · '}
            {motifs.length} motif{motifs.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            to={`/patients/${patient.id}?onglet=preparation`}
            className="rounded-lg border border-navy/10 bg-white/70 px-2.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-white"
          >
            Fiche
          </Link>
          <a
            href={`tel:${patient.identite.telephone}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-magenta/35 bg-magenta/[0.09] px-3 py-2 text-xs font-semibold text-magenta transition-all hover:brightness-95"
          >
            <PhoneCall size={13} /> Appeler
          </a>
        </div>
      </div>

      {/* Un seul appel, tous les motifs traités dans la foulée. */}
      <ol className="mt-3 space-y-3">
        {motifs.map((m, i) => (
          <li key={m.code} className="rounded-lg border border-navy/[0.07] bg-white/70 p-3">
            <p className={`flex items-start gap-2 text-sm font-semibold ${TONS[m.ton].texte}`}>
              <span className="mt-0.5 shrink-0 text-[11px] font-bold tabular-nums opacity-60">{i + 1}.</span>
              <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {m.titre}
            </p>
            <p className="mt-1.5 pl-6 text-xs leading-relaxed text-slate-700">{m.detail}</p>
            {SCRIPTS[m.code] ? (
              <p className="mt-2 pl-6 text-xs italic leading-relaxed text-slate-600">« {SCRIPTS[m.code]} »</p>
            ) : null}
          </li>
        ))}
      </ol>
    </article>
  );
}

/** Un patient = un appel : ses motifs sont regroupés, les rouges passent devant. */
export function fileDAppels(patients) {
  return patients
    .map((p) => ({ patient: p, motifs: alertesActives(p) }))
    .filter((f) => f.motifs.length)
    .sort((x, y) => {
      const xr = x.motifs.some((m) => m.ton === 'ruby');
      const yr = y.motifs.some((m) => m.ton === 'ruby');
      if (xr !== yr) return xr ? -1 : 1;
      return new Date(x.patient.examen.date) - new Date(y.patient.examen.date);
    });
}

export default function FileRappels({ file }) {
  if (file.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-400/50 bg-emerald-50/60 p-5 text-center">
        <CheckCircle2 size={20} className="mx-auto text-emerald-700" />
        <p className="mt-2 text-sm font-semibold text-emerald-700">Aucun rappel en attente</p>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-700">
          Tous les dossiers sont conformes. Un patient apparaît ici dès qu’il déclare un écart, ou qu’une pièce manque à l’approche de l’examen.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {file.map(({ patient, motifs }) => (
        <Carte key={patient.id} patient={patient} motifs={motifs} />
      ))}
    </div>
  );
}
