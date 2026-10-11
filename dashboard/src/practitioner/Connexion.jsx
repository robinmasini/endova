import { useState } from 'react';
import { Lock, ShieldCheck } from '../components/icones.js';
import GlassCard from '../components/GlassCard.jsx';
import { Bouton } from '../components/ui.jsx';
import { connexion, inscription } from '../lib/session.js';

/**
 * La porte du logiciel du cabinet.
 *
 * Elle n'existe que lorsque les dossiers sont sur un serveur. Tant que tout
 * vit dans le navigateur, il n'y a rien à garder et l'écran ne s'affiche pas.
 */
export default function Connexion() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [creer, setCreer] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [message, setMessage] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  async function valider(e) {
    e.preventDefault();
    setErreur(null);
    setMessage(null);
    setEnvoi(true);
    const souci = creer ? await inscription(email, motDePasse) : await connexion(email, motDePasse);
    setEnvoi(false);
    if (souci) {
      setErreur(souci);
      return;
    }
    if (creer) setMessage('Compte créé. Si la confirmation par e-mail est active, ouvrez le lien reçu avant de vous connecter.');
  }

  const champ = 'w-full rounded-xl border border-navy/[0.1] bg-white/80 px-3.5 py-2.5 text-sm text-navy outline-none transition-colors focus:border-navy/35';

  return (
    <div className="flex min-h-dvh items-center justify-center p-5">
      <GlassCard deep className="w-full max-w-sm p-7 rise">
        <img src={`${import.meta.env.BASE_URL}endova-logo.png`} alt="Endova" className="mx-auto h-20 w-auto" />
        <h1 className="mt-6 text-center text-xl font-semibold tracking-tight text-navy">
          {creer ? 'Créer un accès' : 'Logiciel du cabinet'}
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-slate-600">
          Les dossiers contiennent des données de santé. L’accès est nominatif.
        </p>

        <form onSubmit={valider} className="mt-6 space-y-3">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-700">Adresse e-mail</label>
            <input
              id="email" type="email" required autoComplete="username"
              value={email} onChange={(e) => setEmail(e.target.value)} className={champ}
            />
          </div>
          <div>
            <label htmlFor="mdp" className="mb-1.5 block text-xs font-medium text-slate-700">Mot de passe</label>
            <input
              id="mdp" type="password" required minLength={8}
              autoComplete={creer ? 'new-password' : 'current-password'}
              value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} className={champ}
            />
          </div>

          {erreur ? (
            <p className="rounded-xl border border-rose-400/50 bg-rose-50/70 px-3.5 py-2.5 text-xs leading-relaxed text-rose-700">
              {erreur}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-xl border border-emerald-400/50 bg-emerald-50/70 px-3.5 py-2.5 text-xs leading-relaxed text-emerald-800">
              {message}
            </p>
          ) : null}

          <Bouton ton="marque" disabled={envoi} className="w-full">
            <Lock size={15} /> {creer ? 'Créer l’accès' : 'Entrer'}
          </Bouton>
        </form>

        <button
          type="button"
          onClick={() => { setCreer(!creer); setErreur(null); setMessage(null); }}
          className="mt-4 w-full text-center text-xs text-slate-600 underline-offset-2 hover:text-navy hover:underline"
        >
          {creer ? 'J’ai déjà un accès' : 'Créer un premier accès'}
        </button>

        <p className="mt-6 flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
          <ShieldCheck size={13} className="mt-0.5 shrink-0" />
          L’hébergement doit être certifié HDS avant toute mise en service avec de vrais patients.
        </p>
      </GlassCard>
    </div>
  );
}
