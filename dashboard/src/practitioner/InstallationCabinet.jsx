import { useState } from 'react';
import { Building2, ShieldCheck } from '../components/icones.js';
import GlassCard from '../components/GlassCard.jsx';
import { Bouton } from '../components/ui.jsx';
import { installerCabinet } from '../lib/distant.js';
import { deconnexion } from '../lib/session.js';

/**
 * Premier écran d'un compte neuf.
 *
 * Un utilisateur sans cabinet ne voit aucun dossier — et un tableau vide se
 * prend pour une panne. Mieux vaut le dire et proposer le seul geste utile.
 */
export default function InstallationCabinet({ onInstalle }) {
  const [nom, setNom] = useState('');
  const [nomCourt, setNomCourt] = useState('');
  const [expediteur, setExpediteur] = useState('');
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  async function valider(e) {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);
    try {
      await installerCabinet({ nom, nomCourt, expediteur: expediteur.toUpperCase() });
      await onInstalle();
    } catch (souci) {
      setErreur(souci.message);
    } finally {
      setEnvoi(false);
    }
  }

  const champ = 'w-full rounded-xl border border-navy/[0.1] bg-white/80 px-3.5 py-2.5 text-sm text-navy outline-none transition-colors focus:border-navy/35';

  return (
    <div className="flex min-h-dvh items-center justify-center p-5">
      <GlassCard deep className="w-full max-w-md p-7 rise">
        <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-navy/[0.07] text-navy">
          <Building2 size={20} />
        </span>
        <h1 className="mt-5 text-center text-xl font-semibold tracking-tight text-navy">Votre cabinet</h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-slate-600">
          Ce compte n’est rattaché à aucun cabinet. Créez-le : c’est lui qui portera les dossiers,
          et aucun autre cabinet ne pourra les lire.
        </p>

        <form onSubmit={valider} className="mt-6 space-y-3">
          <div>
            <label htmlFor="nom" className="mb-1.5 block text-xs font-medium text-slate-700">Raison sociale</label>
            <input id="nom" required value={nom} onChange={(e) => setNom(e.target.value)}
              placeholder="Cabinet de gastro-entérologie des Tilleuls" className={champ} />
          </div>
          <div>
            <label htmlFor="court" className="mb-1.5 block text-xs font-medium text-slate-700">Nom court, celui qui ouvre les SMS</label>
            <input id="court" required value={nomCourt} onChange={(e) => setNomCourt(e.target.value)}
              placeholder="Cabinet des Tilleuls" className={champ} />
          </div>
          <div>
            <label htmlFor="exp" className="mb-1.5 block text-xs font-medium text-slate-700">Expéditeur SMS</label>
            <input id="exp" required maxLength={11} value={expediteur}
              onChange={(e) => setExpediteur(e.target.value.toUpperCase())}
              placeholder="TILLEULS-GE" className={`${champ} uppercase`} />
            <p className="mt-1.5 text-[11px] text-slate-500">Onze caractères au plus : c’est la limite des opérateurs.</p>
          </div>

          {erreur ? (
            <p className="rounded-xl border border-rose-400/50 bg-rose-50/70 px-3.5 py-2.5 text-xs leading-relaxed text-rose-700">{erreur}</p>
          ) : null}

          <Bouton ton="marque" disabled={envoi} className="w-full">
            <Building2 size={15} /> Créer le cabinet
          </Bouton>
        </form>

        <button type="button" onClick={deconnexion}
          className="mt-4 w-full text-center text-xs text-slate-600 underline-offset-2 hover:text-navy hover:underline">
          Se déconnecter
        </button>

        <p className="mt-6 flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
          <ShieldCheck size={13} className="mt-0.5 shrink-0" />
          L’hébergement doit être certifié HDS avant toute mise en service avec de vrais patients.
        </p>
      </GlassCard>
    </div>
  );
}
