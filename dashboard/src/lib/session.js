import { useEffect, useState } from 'react';
import { supabase, supabaseConfigure } from './supabase.js';

/**
 * La session du praticien.
 *
 * Tant que Supabase n'est pas configuré, il n'y a pas de session et il n'y a
 * rien à garder : l'application tourne sur le stockage du navigateur et reste
 * ouverte, comme la maquette l'a toujours été. Dès qu'une clé est fournie, le
 * logiciel du cabinet passe derrière une porte — parce qu'à partir de là, les
 * dossiers ne sont plus sur la machine de celui qui regarde.
 */
export function useSession() {
  const [etat, setEtat] = useState(
    supabaseConfigure ? { phase: 'chargement', session: null } : { phase: 'ouvert', session: null },
  );

  useEffect(() => {
    if (!supabase) return undefined;
    let vivant = true;

    supabase.auth.getSession().then(({ data }) => {
      if (vivant) setEtat({ phase: data.session ? 'connecte' : 'anonyme', session: data.session });
    });

    const { data: abonnement } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (vivant) setEtat({ phase: session ? 'connecte' : 'anonyme', session });
    });

    return () => {
      vivant = false;
      abonnement.subscription.unsubscribe();
    };
  }, []);

  return etat;
}

export async function connexion(email, motDePasse) {
  const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
  return error?.message ?? null;
}

export async function inscription(email, motDePasse) {
  const { error } = await supabase.auth.signUp({ email, password: motDePasse });
  return error?.message ?? null;
}

export async function deconnexion() {
  await supabase?.auth.signOut();
}
