import { HeaderAdmin } from "@/components/shared/header";
import { createClient } from "@/lib/supabase/server";
import { SonNouvelleCommande } from "@/components/shared/son-nouvelle-commande";
import { PushNotificationSetup } from "@/components/shared/push-notification-setup";
import { listerComptesLies } from "./comptes-lies/actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  // getSession() lit la session depuis le cookie, sans appel réseau
  // systématique vers Supabase à chaque affichage de page (contrairement
  // à getUser()) — l'id récupéré ici ne sert qu'à filtrer les propres
  // données de la personne, déjà protégées indépendamment par les
  // policies RLS de la base de données.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  // Les inscriptions sont désormais validées automatiquement (voir
  // 06_DECISIONS_TECHNIQUES.md) — ce badge informe des inscriptions
  // récentes plutôt que d'une file d'attente à traiter.
  const septJoursAvant = new Date();
  septJoursAvant.setDate(septJoursAvant.getDate() - 7);

  // Requêtes indépendantes, lancées en parallèle plutôt que l'une après
  // l'autre.
  const [{ count: commerciauxRecents }, { count: commandesNouvelles }, liens] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "commercial").gte("created_at", septJoursAvant.toISOString()),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("statut", "confirmation"),
    listerComptesLies(),
  ]);

  return (
    <div className="min-h-dvh bg-beige-50">
      {user?.id && <SonNouvelleCommande adminId={user.id} />}
      {user?.id && <PushNotificationSetup />}
      <HeaderAdmin
        counts={{
          commerciauxRecents: commerciauxRecents ?? 0,
          commandesNouvelles: commandesNouvelles ?? 0,
        }}
        comptesLies={liens}
      />
      <div className="mx-auto max-w-7xl px-6 py-8 print:p-0">{children}</div>
    </div>
  );
}
