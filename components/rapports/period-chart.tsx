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
  data2,
  label = "Valeur",
  label2 = "Comparaison",
  type = "bar",
  unite = "nombre",
  defaultGranularite = "mois",
  color = "#C25E3F",
  color2 = "rgb(var(--color-ink-900))",
}: {
  title: string;
  data: PointJournalier[];
  /** Deuxième série optionnelle, affichée en comparaison sur le même graphique (courbes uniquement). */
  data2?: PointJournalier[];
  label?: string;
  label2?: string;
  type?: "bar" | "line";
  /** "fcfa" formate en FCFA, "nombre" affiche la valeur brute — évite de
   * passer une fonction en prop (impossible entre Server et Client Component). */
  unite?: "fcfa" | "nombre";
  defaultGranularite?: Granularite;
  color?: string;
  color2?: string;
}) {
  const [granularite, setGranularite] = useState<Granularite>(defaultGranularite);
  const points = useMemo(() => agregerParPeriode(data, granularite), [data, granularite]);
  const points2 = useMemo(() => (data2 ? agregerParPeriode(data2, granularite) : null), [data2, granularite]);
  const format = unite === "fcfa" ? formatFCFA : (v: number) => String(v);

  // Fusionne les deux séries sur le même axe (par label), pour un graphique
  // de comparaison à deux courbes.
  const pointsFusionnes = useMemo(() => {
    if (!points2) return points;
    const map = new Map<string, { label: string; valeur: number; valeur2: number }>();
    for (const p of points) map.set(p.label, { label: p.label, valeur: p.valeur, valeur2: 0 });
    for (const p of points2) {
      const existant = map.get(p.label);
      if (existant) existant.valeur2 = p.valeur;
      else map.set(p.label, { label: p.label, valeur: 0, valeur2: p.valeur });
    }
    return Array.from(map.values());
  }, [points, points2]);

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
                granularite === o.value ? "bg-surface shadow-sm" : "text-ink-900/50 hover:text-ink-900"
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
        <>
          {points2 && (
            <div className="mb-2 flex gap-4 text-xs text-ink-900/60">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: color }} />{label}</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: color2 }} />{label2}</span>
            </div>
          )}
          <ResponsiveContainer width="100%" height={280}>
            {type === "bar" ? (
              <BarChart data={pointsFusionnes}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-ink-900) / 0.06)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => format(v)} />
                <Bar dataKey="valeur" fill={color} radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={pointsFusionnes}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-ink-900) / 0.06)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => format(v)} />
                <Line type="monotone" dataKey="valeur" name={label} stroke={color} strokeWidth={2} dot={false} />
                {points2 && (
                  <Line type="monotone" dataKey="valeur2" name={label2} stroke={color2} strokeWidth={2} dot={false} />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        </>
      )}
    </Card>
  );
}
