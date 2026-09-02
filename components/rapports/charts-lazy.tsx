"use client";

import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

// Recharts pèse plusieurs dizaines de Ko à lui seul — le dynamic() ci-dessous
// tourne dans ce fichier client (pas dans page.tsx, un Server Component, où
// `ssr: false` est interdit) pour vraiment sortir la lib du JS envoyé au
// premier chargement, pas juste la découper en chunk séparé toujours
// server-rendu. Le squelette ci-dessous s'affiche le temps du chargement.
function SqueletteGraphique() {
  return (
    <Card>
      <div className="h-[280px] animate-pulse rounded-xl bg-beige-100" />
    </Card>
  );
}

export const PeriodChart = dynamic(() => import("./period-chart").then((m) => m.PeriodChart), {
  ssr: false,
  loading: SqueletteGraphique,
});

export const CommercialPerformanceChart = dynamic(
  () => import("./commercial-performance-chart").then((m) => m.CommercialPerformanceChart),
  { ssr: false, loading: SqueletteGraphique }
);
