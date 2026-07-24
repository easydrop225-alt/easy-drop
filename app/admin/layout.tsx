import { HeaderAdmin } from "@/components/shared/header";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { count: commerciauxEnAttente } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "commercial")
    .eq("statut", "en_attente");

  const { count: commandesNouvelles } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("statut", "nouvelle");

  return (
    <div className="min-h-screen bg-beige-50">
      <HeaderAdmin
        counts={{
          commerciauxEnAttente: commerciauxEnAttente ?? 0,
          commandesNouvelles: commandesNouvelles ?? 0,
        }}
      />
      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
    </div>
  );
}
