"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * Lie le compte actuellement connecté à un autre compte (ex : super admin
 * + compte de test), pour pouvoir basculer instantanément de l'un à
 * l'autre par la suite, sans jamais retaper de mot de passe.
 *
 * Réservé au super admin : c'est une fonctionnalité sensible (elle stocke
 * de quoi rouvrir une session sur un autre compte), donc on limite qui
 * peut la déclencher, même si le compte visé peut être n'importe quel
 * rôle (commercial, admin...).
 */
export async function lierCompte(email: string, motDePasse: string) {
  const supabase = await createClient();
  const { data: { session: sessionActuelle } } = await supabase.auth.getSession();
  if (!sessionActuelle) return { error: "Session expirée, reconnecte-toi." };

  const admin = createAdminClient();
  const { data: monProfil } = await admin
    .from("profiles")
    .select("role, nom, prenom")
    .eq("id", sessionActuelle.user.id)
    .single();

  if (monProfil?.role !== "super_admin") {
    return { error: "Cette fonctionnalité est réservée au super administrateur." };
  }

  // Connexion à l'AUTRE compte dans un client complètement séparé : ça ne
  // touche jamais aux cookies de la session actuelle dans ce navigateur.
  const clientTemporaire = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: connexionAutreCompte, error: erreurConnexion } = await clientTemporaire.auth.signInWithPassword({
    email,
    password: motDePasse,
  });

  if (erreurConnexion || !connexionAutreCompte.session) {
    return { error: "Identifiants incorrects pour ce compte." };
  }

  const autreCompteId = connexionAutreCompte.session.user.id;
  if (autreCompteId === sessionActuelle.user.id) {
    return { error: "C'est déjà ton compte actuel." };
  }

  const { data: autreProfil } = await admin
    .from("profiles")
    .select("nom, prenom, email, nom_boutique")
    .eq("id", autreCompteId)
    .single();

  const labelMoi = `${monProfil?.prenom ?? ""} ${monProfil?.nom ?? ""}`.trim() || "Mon compte";
  const labelAutre =
    `${autreProfil?.prenom ?? ""} ${autreProfil?.nom ?? ""}`.trim() ||
    autreProfil?.nom_boutique ||
    autreProfil?.email ||
    email;

  const { error: erreurLien } = await admin.from("comptes_lies").upsert(
    {
      compte_a_id: sessionActuelle.user.id,
      compte_b_id: autreCompteId,
      refresh_token_a: sessionActuelle.refresh_token,
      refresh_token_b: connexionAutreCompte.session.refresh_token,
      label_a: labelMoi,
      label_b: labelAutre,
    },
    { onConflict: "compte_a_id,compte_b_id" }
  );

  if (erreurLien) return { error: erreurLien.message };

  revalidatePath("/admin/parametres");
  return { success: true, label: labelAutre };
}

/**
 * Retire un lien entre deux comptes (dans les deux sens).
 */
export async function delierCompte(lienId: string) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Session expirée." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("comptes_lies")
    .delete()
    .eq("id", lienId)
    .or(`compte_a_id.eq.${session.user.id},compte_b_id.eq.${session.user.id}`);

  if (error) return { error: error.message };
  revalidatePath("/admin/parametres");
  return { success: true };
}

/**
 * Récupère les comptes liés au compte actuellement connecté, pour les
 * afficher (bouton de bascule, liste dans Paramètres).
 *
 * Profite de cet appel (déclenché à chaque chargement de page) pour garder
 * le jeton de rafraîchissement de CE compte à jour dans les liens existants
 * — indispensable, car Supabase renouvelle silencieusement ce jeton à
 * chaque utilisation normale de l'app (rotation de sécurité). Sans cette
 * mise à jour continue, la valeur enregistrée à la création du lien devient
 * périmée dès la première navigation qui suit, et la bascule échoue.
 */
export async function listerComptesLies() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data } = await supabase
    .from("comptes_lies")
    .select("*")
    .or(`compte_a_id.eq.${session.user.id},compte_b_id.eq.${session.user.id}`);

  const liens = data ?? [];

  if (liens.length > 0 && session.refresh_token) {
    try {
      const admin = createAdminClient();
      for (const lien of liens) {
        const estA = lien.compte_a_id === session.user.id;
        const champ = estA ? "refresh_token_a" : "refresh_token_b";
        const valeurActuelle = estA ? lien.refresh_token_a : lien.refresh_token_b;
        // On n'écrit que si la valeur a changé, pour ne pas faire une
        // requête d'écriture inutile à chaque page si rien n'a bougé.
        if (valeurActuelle !== session.refresh_token) {
          await admin.from("comptes_lies").update({ [champ]: session.refresh_token }).eq("id", lien.id);
        }
      }
    } catch {
      // Ne bloque jamais l'affichage de la page pour ça.
    }
  }

  return liens.map((lien) => {
    const estA = lien.compte_a_id === session.user.id;
    return {
      lienId: lien.id as string,
      compteCibleId: (estA ? lien.compte_b_id : lien.compte_a_id) as string,
      label: (estA ? lien.label_b : lien.label_a) as string,
    };
  });
}

/**
 * Bascule instantanément vers un compte lié, sans redemander de mot de
 * passe — utilise le jeton de rafraîchissement stocké lors de la liaison
 * (mis à jour à chaque bascule, car ce jeton change à chaque utilisation).
 */
export async function basculerVersCompte(compteCibleId: string) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Session expirée." };

  const admin = createAdminClient();
  const { data: lien } = await admin
    .from("comptes_lies")
    .select("*")
    .or(
      `and(compte_a_id.eq.${session.user.id},compte_b_id.eq.${compteCibleId}),and(compte_a_id.eq.${compteCibleId},compte_b_id.eq.${session.user.id})`
    )
    .maybeSingle();

  if (!lien) return { error: "Ce compte n'est pas lié au tien." };

  const cibleEstA = lien.compte_a_id === compteCibleId;
  const refreshTokenCible = cibleEstA ? lien.refresh_token_a : lien.refresh_token_b;
  if (!refreshTokenCible) return { error: "Lien invalide — relie ce compte à nouveau depuis Paramètres." };

  const { data: nouvelleSession, error } = await supabase.auth.refreshSession({
    refresh_token: refreshTokenCible,
  });

  if (error || !nouvelleSession.session) {
    return { error: "Impossible de basculer — relie ce compte à nouveau depuis Paramètres." };
  }

  // Le jeton change à chaque utilisation (rotation de sécurité normale) :
  // on garde la nouvelle valeur pour que la prochaine bascule fonctionne.
  const champATmettreAJour = cibleEstA ? "refresh_token_a" : "refresh_token_b";
  await admin.from("comptes_lies").update({ [champATmettreAJour]: nouvelleSession.session.refresh_token }).eq("id", lien.id);

  const { data: profilCible } = await admin.from("profiles").select("role").eq("id", compteCibleId).single();

  if (profilCible?.role === "admin" || profilCible?.role === "super_admin") {
    redirect("/admin/dashboard");
  }
  redirect("/accueil");
}
