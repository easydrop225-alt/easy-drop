import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Récupère l'adresse IP du visiteur depuis les en-têtes de la requête.
 * Vercel transmet l'IP réelle via `x-forwarded-for` (peut contenir
 * plusieurs IP séparées par des virgules si des proxys intermédiaires
 * existent — la première est celle du client d'origine).
 */
export async function recupererIP(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return h.get("x-real-ip");
}

/**
 * Enregistre un événement de connexion/déconnexion dans le journal
 * d'activité (table `activity_logs`), avec l'adresse IP — voir
 * cahier des charges §25 ("Qui ? Quelle action ? Quand ? Adresse IP ?").
 *
 * Passe par le client admin (service_role) plutôt que le client normal :
 * la fonction SQL `journaliser_connexion` était appelable directement via
 * l'API REST publique de Supabase avec la seule clé anon (visible de tous),
 * ce qui permettait à n'importe qui d'insérer de faux "connexion_echouee"
 * pour n'importe quel identifiant et de déclencher le blocage de 15 min
 * (voir compterEchecsRecents) sur le compte de quelqu'un d'autre, sans
 * authentification. Le droit d'exécution a été retiré à anon/authenticated
 * en base (voir migration) : seul ce client, côté serveur uniquement, peut
 * désormais l'appeler.
 *
 * Ne bloque jamais le flux de connexion en cas d'erreur d'écriture du
 * journal : la sécurité fonctionnelle prime sur la traçabilité.
 */
export async function journaliserConnexion(
  action: "connexion_reussie" | "connexion_echouee" | "deconnexion" | "inscription",
  userId: string | null,
  details?: Record<string, unknown>
) {
  try {
    const supabase = createAdminClient();
    const ip = await recupererIP();
    await supabase.rpc("journaliser_connexion", {
      p_user_id: userId,
      p_action: action,
      p_details: details ?? null,
      p_ip: ip,
    });
  } catch {
    // Le journal d'activité est un plus, pas une dépendance critique :
    // une erreur ici ne doit jamais empêcher quelqu'un de se connecter.
  }
}
