"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate, formatFCFA } from "@/lib/utils";
import { exporterCSV } from "@/lib/export-csv";
import { Button } from "@/components/ui/button";
import { BoutonReinitialiserMotDePasse } from "./bouton-reinitialiser-mot-de-passe";
import type { Profile } from "@/types/database";

type Tri = "recents" | "performance" | "alphabetique" | "ancien_recent" | "recent_ancien" | "parrainage";

interface InfosParrainage {
  nomParrain: string | null;
  filleuls: number;
  filleulsActifs: number;
  points: number;
  niveau: string;
  bonusEstime: number;
}

export function CommerciauxFiltres({
  commerciaux,
  performanceParId,
  parrainageParId,
}: {
  commerciaux: Profile[];
  performanceParId: Record<string, number>;
  parrainageParId: Record<string, InfosParrainage>;
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
      case "parrainage":
        liste.sort((a, b) => (parrainageParId[b.id]?.bonusEstime ?? 0) - (parrainageParId[a.id]?.bonusEstime ?? 0));
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
  }, [commerciaux, recherche, tri, performanceParId, parrainageParId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
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
            className="h-10 rounded-xl border border-ink-900/10 bg-surface px-3 text-sm"
          >
            <option value="recents">Tous les commerciaux</option>
            <option value="performance">Par performance</option>
            <option value="parrainage">Par bonus de parrainage (ce mois)</option>
            <option value="alphabetique">Par ordre alphabétique</option>
            <option value="ancien_recent">Par ancienneté (plus ancien → plus récent)</option>
            <option value="recent_ancien">Par ancienneté (plus récent → plus ancien)</option>
          </select>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            const lignes = listeFiltree.map((c) => {
              const parr = parrainageParId[c.id];
              return [
                `${c.prenom} ${c.nom}`,
                c.nom_boutique ?? "",
                c.telephone,
                c.code_parrainage ?? "",
                parr?.nomParrain ?? "",
                parr?.filleuls ?? 0,
                parr?.filleulsActifs ?? 0,
                parr?.points ?? 0,
                parr?.niveau ?? "",
                parr?.bonusEstime ?? 0,
              ];
            });
            exporterCSV("easydrop-parrainage", [
              "Commercial", "Boutique", "Téléphone", "Mon code", "Parrainé par",
              "Filleuls", "Filleuls actifs (ce mois)", "Points (ce mois)", "Niveau", "Bonus estimé (ce mois)",
            ], lignes);
          }}
        >
          📊 Exporter le parrainage (CSV)
        </Button>
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
              <th className="p-3">Parrainage (ce mois)</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Inscrit le</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listeFiltree.map((c) => {
              const parr = parrainageParId[c.id];
              return (
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
                  <td className="p-3 text-xs">
                    {parr ? (
                      <>
                        <p>{parr.filleuls} filleul(s) — {parr.filleulsActifs} actif(s)</p>
                        <p className="text-ink-900/50">{parr.points} pts · {parr.niveau} · <span className="font-medium text-terracotta-600">{formatFCFA(parr.bonusEstime)}</span></p>
                        {parr.nomParrain && <p className="mt-0.5 text-ink-900/40">Parrainé par {parr.nomParrain}</p>}
                      </>
                    ) : "—"}
                  </td>
                  <td className="p-3">{c.statut}</td>
                  <td className="p-3">{formatDate(c.created_at)}</td>
                  <td className="p-3">
                    <BoutonReinitialiserMotDePasse commercialId={c.id} nomComplet={`${c.prenom} ${c.nom}`} />
                  </td>
                </tr>
              );
            })}
            {listeFiltree.length === 0 && (
              <tr><td colSpan={tri === "performance" ? 9 : 8} className="p-6 text-center text-ink-900/40">Aucun commercial trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
