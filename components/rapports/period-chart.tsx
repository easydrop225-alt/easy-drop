"use client";

import { useMemo, useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { agregerParPeriode, type Granularite, type PointJournalier } from "@/lib/stats/aggregate";
import { Card } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";

const OPTIONS: { value: Granularite; label: string }[] = [
  { value: "jour", label: "Journalier" },
  { value: "semaine", label: "Hebdomadaire" },
  { value: "mois", label: "Mensuel" },
  { value: "annee", label: "Annuel" },
];

export function PeriodChart({
  title,
  data,
  type = "bar",
  unite = "nombre",
  defaultGranularite = "mois",
  color = "#C25E3F",
}: {
  title: string;
  data: PointJournalier[];
  type?: "bar" | "line";
  /** "fcfa" formate en FCFA, "nombre" affiche la valeur brute — évite de
   * passer une fonction en prop (impossible entre Server et Client Component). */
  unite?: "fcfa" | "nombre";
  defaultGranularite?: Granularite;
  color?: string;
}) {
  const [granularite, setGranularite] = useState<Granularite>(defaultGranularite);
  const points = useMemo(() => agregerParPeriode(data, granularite), [data, granularite]);
  const format = unite === "fcfa" ? formatFCFA : (v: number) => String(v);

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-medium">{title}</h3>
        <div className="flex gap-1 rounded-lg bg-beige-100 p-1">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setGranularite(o.value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                granularite === o.value ? "bg-white shadow-sm" : "text-ink-900/50 hover:text-ink-900"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {points.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-900/40">Pas encore assez de données pour cette vue.</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          {type === "bar" ? (
            <BarChart data={points}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A181610" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => format(v)} />
              <Bar dataKey="valeur" fill={color} radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={points}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A181610" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => format(v)} />
              <Line type="monotone" dataKey="valeur" stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      )}
    </Card>
  );
}
