"use client";

import { useState, useTransition } from "react";
import { definirStockProduit } from "@/app/admin/produits/variantes-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** Admin > Stocks : commencer à suivre le stock d'un produit sans variantes. */
export function DefinirStockInline({ productId }: { productId: string }) {
  const [quantite, setQuantite] = useState("");
  const [pending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  function valider() {
    setErreur(null);
    startTransition(async () => {
      const res = await definirStockProduit(productId, Number(quantite));
      if ("error" in res && res.error) setErreur(res.error);
      else setQuantite("");
    });
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <Input type="number" min={0} placeholder="Stock" value={quantite} onChange={(e) => setQuantite(e.target.value)} className="h-8 w-24" />
        <Button size="sm" disabled={pending || quantite === ""} onClick={valider} className="h-8 px-2 text-xs">
          {pending ? "..." : "Définir"}
        </Button>
      </div>
      {erreur && <p className="mt-1 text-xs text-red-600">{erreur}</p>}
    </div>
  );
}
