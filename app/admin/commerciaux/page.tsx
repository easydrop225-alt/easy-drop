import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types/database";

export default async function AdminCommerciauxPage() {
  const supabase = await createClient();
  const { data: commerciaux } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "commercial")
    .order("created_at", { ascending: false });

  const list = (commerciaux ?? []) as Profile[];
  const enAttente = list.filter((c) => c.statut === "en_attente").length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Commerciaux</h1>
        {enAttente > 0 && (
          <a href="/admin/commerciaux/validation" className="rounded-xl bg-terracotta-500 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-600">
            {enAttente} en attente de validation
          </a>
        )}
      </div>
      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
              <th className="p-3">Photo</th>
              <th className="p-3">Nom</th>
              <th className="p-3">Téléphone</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="border-b border-ink-900/5 last:border-0">
                <td className="p-3">
                  <div className="h-9 w-9 overflow-hidden rounded-full bg-beige-100">
                    {c.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-ink-900/30">
                        {c.prenom?.[0]}{c.nom?.[0]}
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-3">{c.prenom} {c.nom}</td>
                <td className="p-3">{c.telephone}</td>
                <td className="p-3">{c.statut}</td>
                <td className="p-3">{formatDate(c.created_at)}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-ink-900/40">Aucun commercial inscrit.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
