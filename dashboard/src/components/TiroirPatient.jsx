import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  X, PenLine, Trash2, FileText, ExternalLink, ClipboardCheck, PhoneCall,
  MessageSquare, CalendarDays, AlertTriangle, CheckCircle2,
} from './icones.js';
import Jalon from './Jalon.jsx';
import { store } from '../lib/store.js';
import { retoursPatient, TON_PASTILLE } from '../lib/retours.js';
import { calculerScore, statutRisque } from '../lib/score.js';
import { etapesDe } from '../lib/examens.js';
import { age, anesthesieDe, examenDe, heure, jour, nomComplet, protocoleDe, telephoneLisible } from '../lib/patient.js';
import { traitement } from '../lib/terrain.js';
import { TONS } from './ui.jsx';

/**
 * Tiroir du dossier.
 *
 * Cliquer un patient dans une liste ouvrait la fiche complète, c'est-à-dire
 * quatre onglets et un changement de page, pour une question qui tient souvent
 * en trois secondes : où en est-il, qu'est-ce qui manque, faut-il l'appeler.
 * Le tiroir répond à ça sans quitter la liste, et laisse la fiche à ce qu'elle
 * fait bien — le détail.
 */

function Ligne({ libelle, valeur, ton = 'neutre' }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-xs">
      <dt className="shrink-0 text-slate-600">{libelle}</dt>
      <dd className={`text-right font-medium ${ton === 'ruby' ? 'text-rose-700' : ton === 'emerald' ? 'text-emerald-700' : 'text-navy'}`}>
        {valeur}
      </dd>
    </div>
  );
}

function Bloc({ titre, children }) {
  return (
    <section className="rounded-xl border border-navy/[0.07] bg-white/60 p-4">
      <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{titre}</p>
      {children}
    </section>
  );
}

export default function TiroirPatient({ patient, onFermer }) {
  const [confirme, setConfirme] = useState(false);
  const [copie, setCopie] = useState(false);

  if (!patient) return null;

  const { total } = calculerScore(patient);
  const statut = statutRisque(patient);
  const retours = retoursPatient(patient);
  const etapes = etapesDe(patient);
  const courante = etapes.find((e) => !patient.etapes[e.id]?.done);
  const examen = examenDe(patient);
  const protocole = protocoleDe(patient);
  const adm = patient.administratif ?? {};
  const lien = `endova.fr/p/${patient.token}`;
  const traitements = patient.terrain?.traitements ?? [];

  async function copier() {
    try {
      await navigator.clipboard.writeText(`https://${lien}`);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Presse-papier refusé (contexte non sécurisé, permission) : le lien
      // reste lisible à l'écran, on ne bloque pas pour autant.
    }
  }

  function supprimer() {
    store.supprimerPatient(patient.id);
    onFermer();
  }

  return (
    <aside
      aria-label={`Dossier de ${nomComplet(patient)}`}
      className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl border border-navy/[0.07] bg-white/80 shadow-[0_24px_60px_-24px_rgba(5,28,78,0.28)] backdrop-blur-2xl"
    >
      <header className="flex items-start gap-3 border-b border-navy/[0.07] p-5">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-base font-bold tracking-tight text-navy">
            {nomComplet(patient)}
            <span className="rounded-md bg-navy/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{age(patient)} ans</span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-600">
            <CalendarDays size={12} /> {jour(patient.examen.date)} à {heure(patient.examen.date)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Link
            to={`/patients/${patient.id}/modifier`}
            aria-label="Modifier le dossier"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-navy/[0.05] hover:text-navy"
          >
            <PenLine size={15} />
          </Link>
          <button
            type="button"
            onClick={() => setConfirme(true)}
            aria-label="Supprimer le dossier"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700"
          >
            <Trash2 size={15} />
          </button>
          <span className="mx-0.5 h-5 w-px bg-navy/[0.09]" />
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-navy/[0.05] hover:text-navy"
          >
            <X size={15} />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
        {confirme ? (
          <div className="rounded-xl border border-rose-400/50 bg-rose-50/80 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-rose-700">
              <AlertTriangle size={15} /> Supprimer ce dossier ?
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-700">
              Le dossier et sa traçabilité partent avec. C’est définitif, et rien ne le restaure.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button" onClick={supprimer}
                className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-rose-700"
              >
                Supprimer définitivement
              </button>
              <button
                type="button" onClick={() => setConfirme(false)}
                className="rounded-lg border border-navy/[0.09] bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-white/70"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <Link
            to={`/patients/${patient.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white transition-all hover:brightness-110"
          >
            <FileText size={15} /> Accéder à la fiche patient
          </Link>
          <Link
            to={`/p/${patient.token}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-navy/[0.1] bg-white px-4 py-3 text-sm font-semibold text-navy transition-colors hover:bg-white/70"
          >
            <ExternalLink size={15} /> Ouvrir l’espace patient
          </Link>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-navy/[0.07] bg-navy/[0.03] px-3.5 py-2.5">
            <span className="min-w-0 truncate text-[11px] text-slate-600">{lien}</span>
            <button
              type="button" onClick={copier}
              className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-navy hover:underline"
            >
              <ClipboardCheck size={13} /> {copie ? 'Copié' : 'Copier'}
            </button>
          </div>
        </div>

        <Bloc titre={`Retours patient${retours.length ? ` · ${retours.length}` : ''}`}>
          {retours.length ? (
            <div className="flex flex-wrap gap-1.5">
              {retours.map((r) => (
                <span
                  key={r.texte}
                  className={`rounded-md border px-2 py-1 text-[11px] font-medium ${TON_PASTILLE[r.ton] ?? TON_PASTILLE.neutre}`}
                >
                  {r.texte}
                </span>
              ))}
            </div>
          ) : (
            <p className="flex items-center gap-2 text-xs text-emerald-700">
              <CheckCircle2 size={14} /> Rien à signaler sur ce dossier.
            </p>
          )}
        </Bloc>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-navy/[0.07] bg-white/60 p-3.5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Étape</p>
            {courante ? <Jalon taille="s">{courante.cle(patient)}</Jalon> : (
              <p className="text-xs font-semibold text-emerald-700">Préparation close</p>
            )}
          </div>
          <div className="rounded-xl border border-navy/[0.07] bg-white/60 p-3.5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Index</p>
            <p className={`text-lg font-bold tabular-nums ${TONS[statut.ton].texte}`}>
              {total}<span className="text-xs font-medium text-slate-500"> / 100</span>
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">{statut.court}</p>
          </div>
        </div>

        <Bloc titre="Examen">
          <p className="text-sm font-semibold text-navy">{examen.label}</p>
          <p className="mt-0.5 text-xs text-slate-600">{patient.examen.indication}</p>
          <dl className="mt-3 space-y-1.5 border-t border-navy/[0.06] pt-3">
            <Ligne libelle="Lieu" valeur={patient.examen.lieu} />
            <Ligne libelle="Opérateur" valeur={patient.examen.operateur} />
            <Ligne libelle="Anesthésie" valeur={anesthesieDe(patient).label} />
            {protocole ? <Ligne libelle="Préparation" valeur={protocole.nom} /> : null}
          </dl>
        </Bloc>

        <Bloc titre="Dossier administratif">
          <dl className="space-y-1.5">
            {anesthesieDe(patient).cpa ? (
              <Ligne libelle="Consultation d’anesthésie" valeur={adm.cpa?.faite ? 'Faite' : 'À programmer'} ton={adm.cpa?.faite ? 'emerald' : 'ruby'} />
            ) : null}
            <Ligne libelle="Consentement" valeur={adm.consentement ? 'Signé' : 'Manquant'} ton={adm.consentement ? 'emerald' : 'neutre'} />
            {examen.purge ? (
              <Ligne libelle="Ordonnance" valeur={adm.ordonnance ? 'Remise' : 'À remettre'} ton={adm.ordonnance ? 'emerald' : 'neutre'} />
            ) : null}
            <Ligne libelle="Bon d’admission" valeur={adm.bonAdmission ? 'Établi' : 'À établir'} ton={adm.bonAdmission ? 'emerald' : 'neutre'} />
          </dl>
        </Bloc>

        {traitements.length ? (
          <Bloc titre="Traitements à surveiller">
            <div className="flex flex-wrap gap-1.5">
              {traitements.map((id) => (
                <span key={id} className={`rounded-md border px-2 py-1 text-[11px] font-medium ${traitement(id)?.critique ? TON_PASTILLE.ruby : TON_PASTILLE.neutre}`}>
                  {traitement(id)?.label ?? id}
                </span>
              ))}
            </div>
          </Bloc>
        ) : null}
      </div>

      <footer className="grid grid-cols-2 gap-2 border-t border-navy/[0.07] p-4">
        <a
          href={`tel:${patient.identite.telephone}`}
          className="flex items-center justify-center gap-2 rounded-xl border border-navy/[0.1] bg-white px-3 py-2.5 text-xs font-semibold text-navy transition-colors hover:bg-white/70"
        >
          <PhoneCall size={14} /> {telephoneLisible(patient.identite.telephone)}
        </a>
        <Link
          to={`/patients/${patient.id}?onglet=sms`}
          className="flex items-center justify-center gap-2 rounded-xl border border-navy/[0.1] bg-white px-3 py-2.5 text-xs font-semibold text-navy transition-colors hover:bg-white/70"
        >
          <MessageSquare size={14} /> Ses SMS
        </Link>
      </footer>
    </aside>
  );
}
