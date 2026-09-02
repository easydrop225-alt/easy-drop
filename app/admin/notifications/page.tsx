import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { Notification } from "@/types/database";

export default async function AdminNotificationsPage() {
  const supabase = await createClient();
  // getSession() lit la session depuis le cookie, sans appel réseau
  // systématique vers Supabase à chaque affichage de page (contrairement
  // à getUser()) — l'id récupéré ici ne sert qu'à filtrer les propres
  // données de la personne, déjà protégées indépendamment par les
  // policies RLS de la base de données.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("destinataire_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const list = (notifications ?? []) as Notification[];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Centre de notifications</h1>
      <div className="space-y-2">
        {list.map((n) => (
          <Card key={n.id} className={n.lu ? "opacity-60" : ""}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{n.titre}</p>
                <p className="text-sm text-ink-900/60">{n.message}</p>
              </div>
              <span className="text-xs text-ink-900/40">{formatDate(n.created_at)}</span>
            </div>
          </Card>
        ))}
        {list.length === 0 && <p className="text-ink-900/60">Aucune notification.</p>}
      </div>
    </div>
  );
}
