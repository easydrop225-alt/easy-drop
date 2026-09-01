import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Point de passage obligatoire pour les liens envoyés par email par
 * Supabase (réinitialisation de mot de passe, confirmation d'inscription
 * si activée un jour...).
 *
 * Pourquoi cette route existe : Supabase envoie un "code" dans le lien,
 * qu'il faut échanger contre une vraie session AVANT d'afficher la page
 * suivante. Cet échange doit se faire dans une Route Handler (pas une
 * simple page) car c'est le seul endroit où Next.js autorise à écrire les
 * cookies de session — une page classique ne le permet pas, ce qui faisait
 * échouer silencieusement la réinitialisation de mot de passe jusqu'ici.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Code manquant ou invalide/expiré : on renvoie vers la demande de
  // réinitialisation avec une explication, plutôt qu'un formulaire qui
  // échouerait silencieusement.
  return NextResponse.redirect(`${origin}/mot-de-passe-oublie?erreur=lien_invalide`);
}
