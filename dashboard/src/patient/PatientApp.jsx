import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Lock, Check, ChevronRight, ShieldCheck, AlertCircle } from '../components/icones.js';
import { usePatient, useCabinet, store } from '../lib/store.js';
import { etapesDe } from '../lib/examens.js';
import { calculerScore } from '../lib/score.js';
import { anneeNaissance, examenDe, anesthesieDe, protocoleDe, heure, jour, horodatage, nomComplet } from '../lib/patient.js';
import GlassCard from '../components/GlassCard.jsx';
import { Badge, Bouton, Libelle, Marque, TONS } from '../components/ui.jsx';
import EtapeJ7 from './EtapeJ7.jsx';
import EtapeJ3 from './EtapeJ3.jsx';
import EtapeJ1 from './EtapeJ1.jsx';
import EtapeJ2 from './EtapeJ2.jsx';
import EtapeH5 from './EtapeH5.jsx';
import EtapeH2 from './EtapeH2.jsx';
import EtapeG1 from './EtapeG1.jsx';
import EtapeLavements, { EtapeR1 } from './EtapeLavements.jsx';

const ECRANS = { j7: EtapeJ7, j3: EtapeJ3, j2: EtapeJ2, j1: EtapeJ1, h5: EtapeH5, h2: EtapeH2, g1: EtapeG1, r1: EtapeR1, lav: EtapeLavements };

/**
 * Porte d'entrée du lien SMS : pas de mot de passe, mais une seconde preuve.
 * Le token seul ne suffit pas — un SMS transféré ne doit pas ouvrir le dossier.
 */
function Verrou({ patient, onOuvrir }) {
  const [saisie, setSaisie] = useState('');
  const [erreur, setErreur] = useState(false);

  function valider(e) {
    e.preventDefault();
    if (Number(saisie) === anneeNaissance(patient)) {
      // L'ouverture est tracée : c'est la preuve que le patient a eu accès à ses consignes.
      store.journaliser(patient.id, { type: 'lien_ouvert', auteur: nomComplet(patient) });
      onOuvrir();
    }
    else {
      setErreur(true);
      setSaisie('');
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-5">
      <GlassCard deep className="w-full max-w-sm p-7 rise">
        <img src={`${import.meta.env.BASE_URL}endova-logo.png`} alt="Endova" className="mx-auto h-24 w-auto" />
        <h1 className="mt-7 text-xl font-semibold tracking-tight text-navy">Confirmez votre identité</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Pour protéger vos données de santé, indiquez votre année de naissance.
        </p>
        <form onSubmit={valider} className="mt-6">
          <input
            inputMode="numeric"
            autoFocus
            maxLength={4}
            value={saisie}
            onChange={(e) => {
              setSaisie(e.target.value.replace(/\D/g, ''));
              setErreur(false);
            }}
            placeholder="AAAA"
            aria-label="Année de naissance"
            className={`w-full rounded-xl border bg-white/60 px-4 py-4 text-center text-2xl font-semibold tracking-[0.3em] text-navy outline-none transition-colors placeholder:text-slate-700 focus:border-magenta/50 ${
              erreur ? 'border-rose-500/50' : 'border-navy/[0.09]'
            }`}
          />
          {erreur ? (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-rose-700">
              <AlertCircle size={13} /> Année incorrecte. Réessayez.
            </p>
          ) : null}
          <Bouton type="submit" disabled={saisie.length !== 4} className="mt-4 w-full">
            <ShieldCheck size={16} /> Accéder à ma préparation
          </Bouton>
        </form>
      </GlassCard>
    </div>
  );
}

function LigneEtape({ etape, patient, etat, statut, onOuvrir }) {
  const verrouille = statut === 'verrouille';
  const fait = statut === 'fait';
  const ton = fait ? 'emerald' : statut === 'actif' ? 'marque' : 'neutre';

  return (
    <button
      type="button"
      disabled={verrouille}
      onClick={onOuvrir}
      className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 ${
        verrouille
          ? 'cursor-not-allowed border-navy/[0.07] bg-white/40 opacity-55'
          : statut === 'actif'
            ? 'border-magenta/30 bg-magenta/[0.06] shadow-[0_0_25px_rgba(6,182,212,0.12)] hover:bg-magenta/[0.11]'
            : 'border-navy/[0.07] bg-white/55 hover:bg-white/80'
      }`}
    >
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${TONS[ton].bord} ${TONS[ton].fond}`}>
        {fait ? <Check size={15} className="text-emerald-700" strokeWidth={3} />
          : verrouille ? <Lock size={14} className="text-slate-600" />
          : <span className="text-[11px] font-bold text-magenta">{etape.cle(patient)}</span>}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-slate-900">{etape.titre}</span>
        <span className="mt-0.5 block text-xs text-slate-600">
          {fait ? `Validé${etat?.at ? ` · ${new Date(etat.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}`
            : verrouille ? `SMS le ${horodatage(etape.envoi(patient))}`
            : 'À faire maintenant'}
        </span>
      </span>
      {!verrouille ? <ChevronRight size={16} className="shrink-0 text-slate-600" /> : null}
    </button>
  );
}

export default function PatientApp() {
  const { token } = useParams();
  const patient = usePatient(token);
  const cabinet = useCabinet();
  const [ouvert, setOuvert] = useState(false);
  const [etapeActive, setEtapeActive] = useState(null);

  if (!patient) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-5">
        <GlassCard className="max-w-sm p-7 text-center">
          <Marque taille="sm" />
          <p className="mt-5 text-sm text-slate-700">Ce lien n’est plus valide.</p>
          <p className="mt-2 text-xs text-slate-600">Contactez le secrétariat de votre gastro-entérologue au {cabinet.telephone}.</p>
          <Link to="/" className="mt-5 inline-block text-xs text-magenta hover:underline">Vue cabinet</Link>
        </GlassCard>
      </div>
    );
  }

  if (!ouvert) return <Verrou patient={patient} onOuvrir={() => setOuvert(true)} />;

  const protocole = protocoleDe(patient);
  const etapes = etapesDe(patient);
  const { total } = calculerScore(patient);
  // Une étape ne s'ouvre qu'une fois la précédente close : l'échéancier est séquentiel.
  const indexCourant = etapes.findIndex((e) => !patient.etapes[e.id]?.done);

  if (etapeActive) {
    const Ecran = ECRANS[etapeActive];
    return <Ecran patient={patient} protocole={protocole} onFermer={() => setEtapeActive(null)} />;
  }

  const date = patient.examen.date;
  const toutFait = indexCourant === -1;

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md px-5 pb-12 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)]">
      <header className="flex items-center justify-between">
        <Marque />
        <Link to="/" className="text-[11px] text-slate-600 transition-colors hover:text-magenta">Vue cabinet</Link>
      </header>

      <GlassCard deep className="mt-6 p-6 rise">
        <Libelle>Votre examen</Libelle>
        <h1 className="mt-2 text-lg font-semibold leading-tight tracking-tight text-navy">{examenDe(patient).label}</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          {jour(date)} à {heure(date)}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">{patient.examen.lieu} · {patient.examen.operateur}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {protocole ? <Badge ton="marque">{protocole.nom}</Badge> : <Badge ton="marque">{anesthesieDe(patient).label}</Badge>}
          <Badge ton={total >= 80 ? 'emerald' : total >= 50 ? 'amber' : 'neutre'}>
            Préparation {total} %
          </Badge>
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/55">
          <div
            className={`h-full rounded-full transition-all duration-700 ${total >= 80 ? 'bg-emerald-500' : total >= 50 ? 'bg-amber-500' : 'bg-magenta'}`}
            style={{ width: `${Math.max(total, 2)}%` }}
          />
        </div>
      </GlassCard>

      {toutFait ? (
        <GlassCard glow="emerald" className="mt-4 p-5 rise">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
            <ShieldCheck size={16} /> Préparation terminée
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Présentez-vous à l’accueil ({patient.examen.lieu}) 30 minutes avant l’heure indiquée, avec une pièce
            d’identité, votre carte Vitale et le consentement signé.
            {anesthesieDe(patient).accompagnant ? ' Vous devez être accompagné pour le retour.' : ''}
          </p>
        </GlassCard>
      ) : null}

      <Libelle className="mt-8 mb-3">Votre échéancier</Libelle>
      <div className="space-y-2.5">
        {etapes.map((etape, i) => (
          <LigneEtape
            key={etape.id}
            etape={etape}
            patient={patient}
            etat={patient.etapes[etape.id]}
            statut={patient.etapes[etape.id]?.done ? 'fait' : i === indexCourant ? 'actif' : 'verrouille'}
            onOuvrir={() => setEtapeActive(etape.id)}
          />
        ))}
        {/* Le jour J clôt l'échéancier : à partir de là, c'est l'équipe d'endoscopie. */}
        <div className="flex items-center gap-4 rounded-xl border border-dashed border-navy/15 p-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-navy text-[11px] font-bold text-white">J</span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-slate-900">Jour J — votre examen</span>
            <span className="mt-0.5 block text-xs text-slate-600">{jour(date)} à {heure(date)}</span>
          </span>
        </div>
      </div>

      <p className="mt-8 text-center text-[11px] leading-relaxed text-slate-500">
        Une question ? {cabinet.nomCourt} : {cabinet.telephone}
        <br />
        Endova ne remplace pas les consignes de votre gastro-entérologue.
        <br />
        En cas de douleur abdominale intense, appelez le 15.
      </p>
    </div>
  );
}
