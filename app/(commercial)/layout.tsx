import { HeaderCommercial } from "@/components/shared/header";
import { BottomNavCommercial } from "@/components/shared/bottom-nav-commercial";
import { createClient } from "@/lib/supabase/server";

export default async function CommercialLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { count: notificationsNonLues } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("destinataire_id", user?.id ?? "")
    .eq("lu", false);

  return (
    <div className="min-h-screen bg-beige-50">
      <HeaderCommercial notificationsNonLues={notificationsNonLues ?? 0} />
      <div className="mx-auto max-w-6xl px-6 py-8 pb-24 md:pb-8">{children}</div>
      <BottomNavCommercial />
    </div>
  );
}
