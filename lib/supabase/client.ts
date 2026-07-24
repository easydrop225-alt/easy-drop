import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase utilisé dans les Client Components (navigateur).
 * Usage : const supabase = createClient();
 *
 * Note : non typé génériquement (pas de <Database>) tant que les types ne
 * sont pas générés automatiquement depuis le vrai projet Supabase (voir
 * types/database.ts). Les interfaces métier (Profile, Product, Order...)
 * sont utilisées via des casts explicites sur les résultats de requêtes.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
