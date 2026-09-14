"use client";

import { useMemo, useState, useTransition } from "react";
import { changerProduitCommande } from "../actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { libelleVariante } from "@/components/produits/ligne-variante";
import type { Product, ProductVariant } from "@/types/database";

export function ChangerProduitForm({
  itemId,
  productActuelId,
  variantActuelId,
  produits,
  variantes,
}: {
  itemId: string;
  productActuelId: string;
  variantActuelId: string | null;
  produits: Product[];
  variantes: ProductVariant[];
}) {
  const [ouvert, setOuvert] = useState(false);
  const [productId, setProductId] = useState(productActuelId);
  const [variantId, setVariantId] = useState(variantActuelId ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const variantesDuProduit = useMemo(
    () => variantes.filter((v) => v.product_id === productId),
    [variantes, productId]
  );

  function handleChangerProduit(id: string) {
    setProductId(id);
    // Change de produit = on repart d'aucune variante sélectionnée, pour
    // ne jamais garder par erreur une variante d'un autre produit.
    setVariantId("");
  }

  function handleValider() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await changerProduitCommande(itemId, productId, variantId || null);
      if (res?.error) setError(res.error);
      else { setSaved(true); setOuvert(false); }
    });
  }

  if (!ouvert) {
    return (
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setOuvert(true)} className="text-xs text-terracotta-600 underline">
          Le commercial s&apos;est trompé de produit ? Corriger
        </button>
        {saved && <span className="text-xs text-emerald-600">Produit corrigé ✓</span>}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-terracotta-200 bg-terracotta-50 p-3">
      <div>
        <Label htmlFor={`produit-${itemId}`}>Nouveau produit</Label>
        <select
          id={`produit-${itemId}`}
          value={productId}
          onChange={(e) => handleChangerProduit(e.target.value)}
          className="h-10 w-full rounded-xl border border-ink-900/10 bg-surface px-3 text-sm"
        >
          {produits.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
        </select>
      </div>
      {variantesDuProduit.length > 0 && (
        <div>
          <Label htmlFor={`variante-${itemId}`}>Variante</Label>
          <select
            id={`variante-${itemId}`}
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            className="h-10 w-full rounded-xl border border-ink-900/10 bg-surface px-3 text-sm"
          >
            <option value="">— Aucune variante —</option>
            {variantesDuProduit.map((v) => <option key={v.id} value={v.id}>{libelleVariante(v)}</option>)}
          </select>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={pending} onClick={handleValider}>
          {pending ? "Enregistrement..." : "Corriger le produit"}
        </Button>
        <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => setOuvert(false)}>
          Annuler
        </Button>
      </div>
      <p className="text-[11px] text-ink-900/50">
        Le prix fournisseur, le bénéfice et le stock (ancien/nouveau produit) se mettent à jour automatiquement.
      </p>
    </div>
  );
}
