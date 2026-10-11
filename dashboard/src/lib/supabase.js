import { createClient } from '@supabase/supabase-js';

/**
 * Le lien vers Supabase.
 *
 * Il n'est pas obligatoire : sans clé, l'application continue de tourner sur le
 * stockage du navigateur, exactement comme avant. C'est ce qui permet de
 * brancher le serveur sans rien casser, et de revenir en arrière en retirant
 * une variable d'environnement.
 *
 * La clé « anon » est publique par construction : elle part dans le bundle et
 * c'est normal. Ce qui protège les données, ce sont les règles RLS écrites dans
 * la base, jamais le secret de cette clé. La clé `service_role`, elle, ne doit
 * jamais approcher ce dossier.
 */
const URL_SUPABASE = import.meta.env.VITE_SUPABASE_URL ?? '';
const CLE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const supabaseConfigure = Boolean(URL_SUPABASE && CLE_ANON);

export const supabase = supabaseConfigure
  ? createClient(URL_SUPABASE, CLE_ANON, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : null;

/** Un aller-retour, pour savoir si la base répond et si la clé est acceptée. */
export async function verifierLien() {
  if (!supabase) return { ok: false, raison: 'Aucune clé configurée — stockage local.' };
  const { error } = await supabase.from('cabinets').select('id').limit(1);
  if (error) return { ok: false, raison: error.message };
  return { ok: true, raison: 'Base joignable.' };
}
