"use server";

import { createClient } from "@/lib/supabase/server";
import { motDePasseOublieSchema } from "@/lib/validations/schemas";

export async function demanderReinitialisation(_prevState: unknown, formData: FormData) {
  const parsed = motDePasseOublieSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Adresse email invalide." };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://easy-drop-kappa.vercel.app";

  // On ignore volontairement l'éventuelle erreur ("email inconnu" etc.) et on
  // renvoie toujours le même message de succès : ça évite qu'une personne
  // malveillante devine quels emails sont inscrits sur la plateforme en
  // testant des adresses au hasard.
  // Le lien passe d'abord par /auth/callback, qui échange le code contre une
  // vraie session (nécessaire pour que la page de formulaire suivante
  // puisse ensuite changer le mot de passe — voir app/auth/callback/route.ts).
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reinitialiser-mot-de-passe`,
  });

  return { succes: true };
}
