import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase utilisé dans les Server Components, Server Actions
 * et Route Handlers. Doit être recréé à chaque requête (ne pas mettre en cache).
 *
 * Note : non typé génériquement (pas de <Database>) — voir lib/supabase/client.ts.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options ?? {})
            );
          } catch {
            // Appelé depuis un Server Component : ignoré si le middleware
            // gère déjà le rafraîchissement de session.
          }
        },
      },
    }
  );
}
