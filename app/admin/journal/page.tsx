import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types/database";

interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  table_concernee: string | null;
  enregistrement_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export default async function JournalActivitePage() {
  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("activity_logs")
    .select("*, profiles(prenom, nom, nom_boutique)")
    .order("created_at", { ascending: false })
    .limit(200);

  const list = (logs ?? []) as (ActivityLog & { profiles: Pick<Profile, "prenom" | "nom" | "nom_boutique"> | null })[];

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Journal d'activité</h1>
      <p className="mb-6 text-sm text-ink-900/50">Les 200 dernières actions enregistrées automatiquement (qui, quoi, quand).</p>
      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
              <th className="p-3">Date</th>
              <th className="p-3">Utilisateur</th>
              <th className="p-3">Action</th>
              <th className="p-3">Détails</th>
            </tr>
          </thead>
          <tbody>
            {list.map((log) => (
              <tr key={log.id} className="border-b border-ink-900/5 last:border-0">
                <td className="p-3 whitespace-nowrap">
                  {formatDate(log.created_at)} {new Date(log.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="p-3">
                  {log.profiles ? `${log.profiles.prenom} ${log.profiles.nom}` : "Système"}
                  {log.profiles?.nom_boutique && <span className="ml-1 text-xs text-ink-900/40">({log.profiles.nom_boutique})</span>}
                </td>
                <td className="p-3">{log.action}</td>
                <td className="p-3 max-w-xs truncate text-xs text-ink-900/50">
                  {log.details ? JSON.stringify(log.details) : "—"}
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-ink-900/40">Aucune activité enregistrée pour l'instant.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
