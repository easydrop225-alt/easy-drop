import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase "admin", utilisant la clé service_role — à n'utiliser QUE
 * dans du code strictement serveur (Server Actions, Route Handlers), jamais
 * dans un composant client, jamais renvoyé au navigateur.
 *
 * Contrairement au client habituel (lib/supabase/server.ts) qui respecte le
 * RLS selon l'utilisateur connecté, celui-ci contourne totalement le RLS —
 * c'est nécessaire pour des opérations que même un admin connecté ne peut
 * pas faire via l'API publique, comme réinitialiser le mot de passe d'un
 * autre utilisateur.
 *
 * Nécessite la variable d'environnement SUPABASE_SERVICE_ROLE_KEY (SANS le
 * préfixe NEXT_PUBLIC_, pour qu'elle ne soit jamais envoyée au navigateur).
 * À ajouter dans Vercel > Settings > Environment Variables — jamais dans un
 * fichier commité sur GitHub.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY manquante : ajoute-la dans les variables d'environnement Vercel pour utiliser les actions admin avancées (ex : réinitialisation de mot de passe)."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
