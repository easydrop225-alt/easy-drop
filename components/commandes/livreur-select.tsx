"use client";

import { useState, useTransition } from "react";
import { assignerLivreur } from "@/app/admin/livreurs-actions";
import type { Livreur } from "@/types/database";

export function LivreurSelect({
  orderId,
  livreurActuelId,
  livreurs,
}: {
  orderId: string;
  livreurActuelId: string | null;
  livreurs: Livreur[];
}) {
  const [valeur, setValeur] = useState(livreurActuelId ?? "");
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={valeur}
      disabled={pending}
      onChange={(e) => {
        const v = e.target.value;
        setValeur(v);
        startTransition(() => { assignerLivreur(orderId, v || null); });
      }}
      className="h-8 rounded-lg border border-ink-900/10 bg-surface px-2 text-xs"
    >
      <option value="">— Non assigné —</option>
      {livreurs.map((l) => (
        <option key={l.id} value={l.id}>🛵 {l.nom}</option>
      ))}
    </select>
  );
}
