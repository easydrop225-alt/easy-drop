import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { Notification } from "@/types/database";
import { MarquerToutesLuesButton } from "./marquer-lues-button";

export default async function NotificationsCommercialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("destinataire_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const list = (notifications ?? []) as Notification[];
  const nonLues = list.filter((n) => !n.lu).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        {nonLues > 0 && <MarquerToutesLuesButton />}
      </div>
      <div className="space-y-2">
        {list.map((n) => (
          <a key={n.id} href={n.lien ?? "#"}>
            <Card className={n.lu ? "opacity-60" : "border-terracotta-400/40"}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{n.titre}</p>
                  <p className="text-sm text-ink-900/60">{n.message}</p>
                </div>
                <span className="shrink-0 text-xs text-ink-900/40">{formatDate(n.created_at)}</span>
              </div>
            </Card>
          </a>
        ))}
        {list.length === 0 && <p className="text-ink-900/60">Aucune notification pour l'instant.</p>}
      </div>
    </div>
  );
}
