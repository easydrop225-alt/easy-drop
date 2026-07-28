"use client";

import { useState, useTransition } from "react";
import { reapprovisionnerStock } from "@/app/admin/produits/variantes-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export function AjouterStockInline({
  inventoryId,
  productId,
  dernierAjoutQuantite,
  dernierAjoutLe,
}: {
  inventoryId: string;
  productId: string;
  dernierAjoutQuantite: number | null;
  dernierAjoutLe: string | null;
}) {
  const [quantite, setQuantite] = useState("");
  const [pending, startTransition] = useTransition();

  function ajouter() {
    const q = Number(quantite);
    if (!q || q <= 0) return;
    startTransition(async () => {
      await reapprovisionnerStock(inventoryId, productId, q);
      setQuantite("");
    });
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={1}
          placeholder="0"
          value={quantite}
          onChange={(e) => setQuantite(e.target.value)}
          className="h-8 w-16 px-2 text-xs"
        />
        <Button size="sm" disabled={pending || !quantite} onClick={ajouter} className="h-8 px-2 text-xs">
          {pending ? "..." : "Ajouter"}
        </Button>
      </div>
      {dernierAjoutQuantite != null && dernierAjoutLe && (
        <p className="text-[10px] italic text-ink-900/40">
          {formatDate(dernierAjoutLe)} ({dernierAjoutQuantite} ajoutés)
        </p>
      )}
    </div>
  );
}
