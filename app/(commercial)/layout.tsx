import { HeaderCommercial } from "@/components/shared/header";
import { BottomNavCommercial } from "@/components/shared/bottom-nav-commercial";
import { OnboardingTutoriel } from "@/components/shared/onboarding-tutoriel";
import { createClient } from "@/lib/supabase/server";
import { PushNotificationSetup } from "@/components/shared/push-notification-setup";
import { listerComptesLies } from "@/app/admin/comptes-lies/actions";

export default async function CommercialLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  // getSession() lit la session depuis le cookie, sans appel réseau
  // systématique vers Supabase à chaque affichage de page (contrairement
  // à getUser()) — l'id récupéré ici ne sert qu'à filtrer les propres
  // données de la personne, déjà protégées indépendamment par les
  // policies RLS de la base de données.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  // Requêtes indépendantes, lancées en parallèle plutôt que l'une après
  // l'autre.
  const [{ count: notificationsNonLues }, { data: profile }, liens] = await Promise.all([
    supabase.from("notifications").select("*", { count: "exact", head: true }).eq("destinataire_id", user?.id ?? "").eq("lu", false),
    supabase.from("profiles").select("onboarding_termine").eq("id", user?.id ?? "").maybeSingle(),
    listerComptesLies(),
  ]);

  return (
    <div className="min-h-dvh bg-beige-50">
      {user?.id && <PushNotificationSetup />}
      {profile && !profile.onboarding_termine && <OnboardingTutoriel />}
      <HeaderCommercial notificationsNonLues={notificationsNonLues ?? 0} comptesLies={liens} />
      <div className="mx-auto max-w-6xl px-6 py-8 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8">{children}</div>
      <BottomNavCommercial />
    </div>
  );
}
