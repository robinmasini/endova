import { Link } from 'react-router-dom';
import { PhoneCall, AlertTriangle, CheckCircle2 } from '../components/icones.js';
import { alertes } from '../lib/score.js';
import { TONS } from '../components/ui.jsx';

/**
 * Ce que le secrétariat doit dire au téléphone, motif par motif.
 * Sans cette phrase, chaque rappel se rejoue de mémoire et perd en précision.
 */
const SCRIPTS = {
  ANTICOAG_SANS_CONSIGNE:
    'Ne modifiez surtout pas votre traitement vous-même. Nous vérifions avec votre cardiologue et nous vous rappelons avec la consigne d’arrêt écrite.',
  PURGE_ABSENTE:
    'Votre préparation doit être récupérée en pharmacie aujourd’hui. Si elle n’est pas en stock, rappelez-nous : nous trouverons une alternative.',
  ECART_REGIME:
    'Reprenez le régime sans résidu strict dès maintenant. Pas de graines, pas de peaux, pas de fibres jusqu’à l’examen.',
  VOMISSEMENT_PURGE:
    'Faites une pause de 30 minutes, prenez l’antiémétique si vous en avez, puis reprenez par petites gorgées avec une paille. N’abandonnez pas la préparation.',
  EVACUATION_INSUFFISANTE:
    'Continuez l’eau claire jusqu’à l’heure limite de jeûne. Présentez-vous à l’heure : un lavement sera prescrit à l’arrivée si nécessaire.',
  TABAC_H2:
    'Ne fumez plus jusqu’à l’examen. Nous prévenons l’anesthésiste, qui adaptera sa technique.',
  JEUNE_NON_SIGNE:
    'Confirmez-nous l’heure de votre dernière prise alimentaire ou de boisson. C’est indispensable avant l’anesthésie.',
};

function Carte({ patient, motifs }) {
  const induction = new Date(patient.heureInduction);
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
            {patient.nom.toUpperCase()} {patient.prenom}
          </p>
          <p className="mt-0.5 text-xs text-slate-600">
            Bloc n°{patient.ordreBloc} · {induction.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            {' · '}
            {motifs.length} motif{motifs.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            to={`?dossier=${patient.id}`}
            className="rounded-lg border border-navy/10 bg-white/70 px-2.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-white"
          >
            Fiche
          </Link>
          <a
            href={`tel:${patient.telephone}`}
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
    .map((p) => ({ patient: p, motifs: alertes(p) }))
    .filter((f) => f.motifs.length)
    .sort((x, y) => {
      const xr = x.motifs.some((m) => m.ton === 'ruby');
      const yr = y.motifs.some((m) => m.ton === 'ruby');
      if (xr !== yr) return xr ? -1 : 1;
      return new Date(x.patient.heureInduction) - new Date(y.patient.heureInduction);
    });
}

export default function FileRappels({ file }) {
  if (file.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-400/50 bg-emerald-50/60 p-5 text-center">
        <CheckCircle2 size={20} className="mx-auto text-emerald-700" />
        <p className="mt-2 text-sm font-semibold text-emerald-700">Aucun rappel en attente</p>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-700">
          Tous les dossiers échus sont conformes. Un patient apparaît ici dès qu’il déclare un incident dans sa PWA.
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
