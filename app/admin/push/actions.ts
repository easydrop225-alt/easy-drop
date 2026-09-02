"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function enregistrerAbonnementPush(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée." };

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint,user_id" }
  );

  if (error) return { error: error.message };

  // Si ce compte est lié à un autre (voir "Basculer de compte" dans le
  // profil admin), on enregistre aussi ce même appareil pour le compte
  // lié — ainsi les deux comptes reçoivent leurs notifications sur cet
  // appareil, peu importe lequel est actuellement connecté. RLS empêche
  // normalement d'écrire un abonnement pour un autre compte que le sien :
  // on passe volontairement par le client admin pour cette seule ligne,
  // seulement après avoir vérifié que le lien existe bel et bien.
  const { data: liens } = await supabase
    .from("comptes_lies")
    .select("compte_a_id, compte_b_id")
    .or(`compte_a_id.eq.${user.id},compte_b_id.eq.${user.id}`);

  if (liens && liens.length > 0) {
    try {
      const admin = createAdminClient();
      for (const lien of liens) {
        const autreCompteId = lien.compte_a_id === user.id ? lien.compte_b_id : lien.compte_a_id;
        await admin.from("push_subscriptions").upsert(
          {
            user_id: autreCompteId,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
          { onConflict: "endpoint,user_id" }
        );
      }
    } catch {
      // Pas grave si ça échoue : l'abonnement du compte principal est déjà
      // enregistré, ce n'est que le partage avec le compte lié qui échoue.
    }
  }

  return { success: true };
}
