"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types/database";

type Tri = "recents" | "performance" | "alphabetique" | "ancien_recent" | "recent_ancien";

export function CommerciauxFiltres({
  commerciaux,
  performanceParId,
}: {
  commerciaux: Profile[];
  performanceParId: Record<string, number>;
}) {
  const [recherche, setRecherche] = useState("");
  const [tri, setTri] = useState<Tri>("recents");

  const listeFiltree = useMemo(() => {
    let liste = commerciaux.filter((c) => {
      const q = recherche.trim().toLowerCase();
      if (!q) return true;
      return (
        c.nom.toLowerCase().includes(q) ||
        c.prenom.toLowerCase().includes(q) ||
        c.telephone.includes(q) ||
        (c.nom_boutique ?? "").toLowerCase().includes(q)
      );
    });

    liste = [...liste];
    switch (tri) {
      case "performance":
        liste.sort((a, b) => (performanceParId[b.id] ?? 0) - (performanceParId[a.id] ?? 0));
        break;
      case "alphabetique":
        liste.sort((a, b) => `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`));
        break;
      case "ancien_recent":
        liste.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "recent_ancien":
        liste.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      default:
        break;
    }
    return liste;
  }, [commerciaux, recherche, tri]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher (nom, boutique, téléphone)..."
          className="max-w-xs"
        />
        <select
          value={tri}
          onChange={(e) => setTri(e.target.value as Tri)}
          className="h-10 rounded-xl border border-ink-900/10 bg-white px-3 text-sm"
        >
          <option value="recents">Tous les commerciaux</option>
          <option value="performance">Par performance</option>
          <option value="alphabetique">Par ordre alphabétique</option>
          <option value="ancien_recent">Par ancienneté (plus ancien → plus récent)</option>
          <option value="recent_ancien">Par ancienneté (plus récent → plus ancien)</option>
        </select>
      </div>

      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
              <th className="p-3">Photo</th>
              <th className="p-3">Nom</th>
              <th className="p-3">Boutique</th>
              <th className="p-3">Téléphone</th>
              {tri === "performance" && <th className="p-3">Commandes livrées</th>}
              <th className="p-3">Statut</th>
              <th className="p-3">Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            {listeFiltree.map((c) => (
              <tr key={c.id} className="border-b border-ink-900/5 last:border-0">
                <td className="p-3">
                  <div className="h-9 w-9 overflow-hidden rounded-full bg-beige-100">
                    {c.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.photo_url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-ink-900/30">
                        {c.prenom?.[0]}{c.nom?.[0]}
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-3">{c.prenom} {c.nom}</td>
                <td className="p-3">{c.nom_boutique ? <span className="rounded-full bg-beige-100 px-2 py-0.5 text-xs">🏪 {c.nom_boutique}</span> : "—"}</td>
                <td className="p-3">{c.telephone}</td>
                {tri === "performance" && <td className="p-3 font-medium">{performanceParId[c.id] ?? 0}</td>}
                <td className="p-3">{c.statut}</td>
                <td className="p-3">{formatDate(c.created_at)}</td>
              </tr>
            ))}
            {listeFiltree.length === 0 && (
              <tr><td colSpan={tri === "performance" ? 7 : 6} className="p-6 text-center text-ink-900/40">Aucun commercial trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
