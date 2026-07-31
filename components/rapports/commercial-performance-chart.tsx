"use client";

import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import type { PointJournalier } from "@/lib/stats/aggregate";

type Periode = "jour" | "semaine" | "mois" | "annee";

const OPTIONS: { value: Periode; label: string }[] = [
  { value: "jour", label: "Aujourd'hui" },
  { value: "semaine", label: "Cette semaine" },
  { value: "mois", label: "Ce mois" },
  { value: "annee", label: "Cette année" },
];

function debutPeriode(periode: Periode): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (periode === "jour") return d;
  if (periode === "semaine") { d.setDate(d.getDate() - 6); return d; }
  if (periode === "mois") { d.setDate(1); return d; }
  d.setMonth(0, 1);
  return d;
}

export function CommercialPerformanceChart({
  parCommercial,
}: {
  parCommercial: { nom: string; points: PointJournalier[] }[];
}) {
  const [periode, setPeriode] = useState<Periode>("mois");

  const data = useMemo(() => {
    const debut = debutPeriode(periode);
    const debutStr = debut.toISOString().slice(0, 10);
    return parCommercial
      .map((c) => ({
        nom: c.nom,
        valeur: c.points.filter((p) => p.date >= debutStr).reduce((acc, p) => acc + p.valeur, 0),
      }))
      .sort((a, b) => b.valeur - a.valeur);
  }, [parCommercial, periode]);

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-medium">Performance des commerciaux (commandes livrées avec succès)</h3>
        <div className="flex gap-1 rounded-lg bg-beige-100 p-1">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setPeriode(o.value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                periode === o.value ? "bg-surface shadow-sm" : "text-ink-900/50 hover:text-ink-900"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-900/40">Pas encore de commandes livrées.</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(280, data.length * 36)}>
          <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-ink-900) / 0.06)" />
            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
            <YAxis type="category" dataKey="nom" tick={{ fontSize: 11 }} width={120} />
            <Tooltip />
            <Bar dataKey="valeur" fill="#C25E3F" radius={[0, 6, 6, 0]} name="Commandes livrées" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
