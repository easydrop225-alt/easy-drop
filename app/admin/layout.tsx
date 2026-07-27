import { HeaderAdmin } from "@/components/shared/header";
import { createClient } from "@/lib/supabase/server";
import { SonNouvelleCommande } from "@/components/shared/son-nouvelle-commande";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Les inscriptions sont désormais validées automatiquement (voir
  // 06_DECISIONS_TECHNIQUES.md) — ce badge informe des inscriptions
  // récentes plutôt que d'une file d'attente à traiter.
  const septJoursAvant = new Date();
  septJoursAvant.setDate(septJoursAvant.getDate() - 7);

  const { count: commerciauxRecents } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "commercial")
    .gte("created_at", septJoursAvant.toISOString());

  const { count: commandesNouvelles } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("statut", "confirmation");

  return (
    <div className="min-h-screen bg-beige-50">
      {user?.id && <SonNouvelleCommande adminId={user.id} />}
      <HeaderAdmin
        counts={{
          commerciauxRecents: commerciauxRecents ?? 0,
          commandesNouvelles: commandesNouvelles ?? 0,
        }}
      />
      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
    </div>
  );
}
