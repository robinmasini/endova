import { useState } from 'react';
import { Send, RefreshCw, Clock, MessageSquarePlus, Phone, Info } from '../../components/icones.js';
import { store } from '../../lib/store.js';
import { planSms, rediger, STATUTS_SMS } from '../../lib/sms.js';
import { horodatage, telephoneLisible } from '../../lib/patient.js';
import { Carte, Champ, Pastille, BoutonDiscret } from './elements.jsx';

/** Messages types que le secrétariat envoie hors échéancier. */
const MODELES = [
  { label: 'Rappeler le cabinet', texte: '{cabinet} : merci de rappeler le secrétariat au {tel} au sujet de votre examen du {date}.' },
  { label: 'Consultation d’anesthésie', texte: '{cabinet} : pensez à prendre rendez-vous pour votre consultation d’anesthésie, obligatoire avant votre examen du {date}.' },
  { label: 'Consentement', texte: '{cabinet} : merci d’apporter le formulaire de consentement signé le {date}.' },
  { label: 'Lieu et heure', texte: '{cabinet} : votre examen a lieu le {date} à {heure}, {lieu}. Présentez-vous 30 minutes avant.' },
];

/** Un SMS commercial compte 160 caractères ; au-delà, il part en plusieurs segments. */
const segments = (t) => Math.max(1, Math.ceil(t.length / 153));

function Bulle({ item, onRenvoyer }) {
  const planifie = item.statut === 'planifie' || item.statut === 'a_envoyer';
  const s = item.statut ? STATUTS_SMS[item.statut] : null;
  return (
    <li className={`flex flex-col ${item.libre ? 'items-end' : 'items-start'}`}>
      <p className="mb-1.5 flex flex-wrap items-center gap-2 px-1 text-[11px] text-slate-500">
        {item.cle ? <span className="font-bold text-navy">{item.cle}</span> : null}
        {item.titre}
      </p>
      <div
        className={`max-w-[34rem] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          planifie
            ? item.statut === 'a_envoyer'
              ? 'border border-dashed border-rose-300 bg-rose-50/50 text-slate-600'
              : 'border border-dashed border-navy/20 bg-white/40 text-slate-500'
            : item.libre
              ? 'rounded-br-md bg-magenta text-white shadow-[0_6px_18px_-8px_rgba(147,43,156,0.6)]'
              : 'rounded-bl-md border border-white/80 bg-white/85 text-slate-800 shadow-[0_6px_18px_-10px_rgba(5,28,78,0.25)]'
        }`}
      >
        {item.texte}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-2 px-1">
        <span className="flex items-center gap-1 text-[11px] text-slate-500">
          {planifie ? <Clock size={11} /> : null}
          {item.statut === 'a_envoyer' ? 'Échu le ' : planifie ? 'Programmé le ' : 'Délivré le '}{horodatage(item.at)}
        </span>
        {s ? <Pastille ton={s.ton}>{s.label}</Pastille> : null}
        {item.reponse ? <Pastille ton={item.reponse.ton}>Réponse : {item.reponse.texte}</Pastille> : null}
        {!planifie && !item.libre && item.statut !== 'repondu' ? (
          <button type="button" onClick={onRenvoyer} className="inline-flex items-center gap-1 text-[11px] font-medium text-magenta hover:underline">
            <RefreshCw size={11} /> Renvoyer
          </button>
        ) : null}
      </div>
    </li>
  );
}

export default function OngletSms({ patient, cabinet }) {
  const [brouillon, setBrouillon] = useState('');
  const plan = planSms(patient, cabinet);

  const fil = [
    ...plan.map((s) => ({ at: s.delivre ?? s.envoi, cle: s.cle, titre: s.etape.titre, texte: s.texte, statut: s.statut, reponse: s.reponse, etape: s.etape })),
    ...(patient.evenements ?? [])
      .filter((e) => e.type === 'sms_libre' || e.type === 'sms_renvoye')
      .map((e) => ({ at: new Date(e.at), titre: e.type === 'sms_libre' ? `Message du cabinet · ${e.auteur}` : `Renvoi · ${e.auteur}`, texte: e.detail, libre: true })),
  ].sort((a, b) => a.at - b.at);

  const texte = rediger(brouillon, patient, cabinet);
  const prochain = plan.find((s) => s.statut === 'planifie' || s.statut === 'a_envoyer');

  function envoyer(e) {
    e.preventDefault();
    if (!brouillon.trim()) return;
    store.journaliser(patient.id, { type: 'sms_libre', detail: texte });
    setBrouillon('');
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Carte titre="Fil des messages" icone={<Send size={14} />}>
        <ol className="space-y-5">
          {fil.map((item, i) => (
            <Bulle
              key={`${item.at.getTime()}-${i}`}
              item={item}
              onRenvoyer={() => store.journaliser(patient.id, { type: 'sms_renvoye', titre: `SMS ${item.cle} renvoyé`, detail: item.texte })}
            />
          ))}
        </ol>

        <form onSubmit={envoyer} className="mt-6 border-t border-navy/[0.07] pt-5 print:hidden">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-navy"><MessageSquarePlus size={14} /> Message libre</p>
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {MODELES.map((m) => (
              <button
                key={m.label}
                type="button"
                onClick={() => setBrouillon(m.texte)}
                className="rounded-full border border-navy/[0.09] bg-white/70 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:border-magenta/30 hover:text-magenta"
              >
                {m.label}
              </button>
            ))}
          </div>
          <textarea
            value={brouillon}
            onChange={(e) => setBrouillon(e.target.value)}
            rows={3}
            placeholder="Écrire au patient…"
            className="w-full resize-none rounded-xl border border-navy/[0.1] bg-white/80 p-3 text-sm text-navy outline-none placeholder:text-slate-400 focus:border-magenta/50"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500">
              {texte.length} caractères · {segments(texte)} SMS{brouillon.includes('{') ? ' · variables remplacées à l’envoi' : ''}
            </p>
            <button
              type="submit"
              disabled={!brouillon.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-magenta px-4 py-2.5 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:opacity-40"
            >
              <Send size={13} /> Envoyer
            </button>
          </div>
        </form>
      </Carte>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5">
        <Carte titre="Paramètres d’envoi" icone={<Phone size={14} />}>
          <dl>
            <Champ libelle="Destinataire">{telephoneLisible(patient.identite.telephone)}</Champ>
            <Champ libelle="Expéditeur">{cabinet.expediteur}</Champ>
            <Champ libelle="Lien personnel">endova.fr/p/{patient.token}</Champ>
            <Champ libelle="Ouverture">Année de naissance</Champ>
          </dl>
        </Carte>
        {prochain ? (
          <Carte titre="Prochain envoi" icone={<Clock size={14} />}>
            <p className="text-sm font-semibold text-navy">{prochain.cle} — {prochain.etape.titre}</p>
            <p className="mt-1 text-xs text-slate-600">
              {prochain.statut === 'a_envoyer' ? `Échu depuis le ${horodatage(prochain.envoi)} — partira au prochain scan` : horodatage(prochain.envoi)}
            </p>
            <BoutonDiscret
              className="mt-3"
              onClick={() => store.envoyerSms(patient.id, prochain)}
            >
              <Send size={12} /> Envoyer maintenant
            </BoutonDiscret>
          </Carte>
        ) : null}
        <Carte titre="Bon à savoir" icone={<Info size={14} />}>
          <p className="text-xs leading-relaxed text-slate-600">
            Les SMS ne contiennent aucune donnée médicale au-delà du nom de l’examen : les consignes détaillées
            s’ouvrent derrière le lien, après vérification de l’année de naissance. Un SMS transféré ou lu par un
            tiers n’ouvre donc pas le dossier.
          </p>
        </Carte>
      </div>
    </div>
  );
}
