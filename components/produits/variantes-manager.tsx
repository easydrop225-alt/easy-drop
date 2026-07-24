"use client";

import { useState, useTransition } from "react";
import { ajouterVariante, modifierStock, supprimerVariante } from "@/app/admin/produits/variantes-actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { ProductVariant, Inventory } from "@/types/database";

type VariantAvecStock = ProductVariant & { inventory: Inventory[] };

export function VariantesManager({
  productId,
  variants,
}: {
  productId: string;
  variants: VariantAvecStock[];
}) {
  const [couleur, setCouleur] = useState("");
  const [taille, setTaille] = useState("");
  const [stock, setStock] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAjouter() {
    setError(null);
    startTransition(async () => {
      const res = await ajouterVariante(productId, couleur, taille, stock);
      if (res?.error) setError(res.error);
      else { setCouleur(""); setTaille(""); setStock(0); }
    });
  }

  return (
    <Card className="space-y-4">
      <h2 className="font-medium">Variantes (couleur / taille) & stock</h2>

      <div className="space-y-2">
        {variants.map((v) => {
          const inv = v.inventory?.[0];
          return (
            <div key={v.id} className="flex items-center justify-between gap-3 rounded-xl bg-beige-100 px-3 py-2 text-sm">
              <span>{[v.couleur, v.taille].filter(Boolean).join(" / ") || "Standard"}</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  defaultValue={inv?.quantite_disponible ?? 0}
                  className="h-8 w-20"
                  onBlur={(e) => {
                    const val = Number(e.target.value);
                    if (inv) startTransition(() => { modifierStock(inv.id, productId, val); });
                  }}
                />
                <Button
                  size="sm"
                  variant="danger"
                  disabled={pending}
                  onClick={() => startTransition(() => { supprimerVariante(v.id, productId); })}
                >
                  Suppr.
                </Button>
              </div>
            </div>
          );
        })}
        {variants.length === 0 && <p className="text-sm text-ink-900/50">Aucune variante — ajoute-en une ci-dessous.</p>}
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-ink-900/5 pt-4">
        <div>
          <Label htmlFor="couleur">Couleur</Label>
          <Input id="couleur" value={couleur} onChange={(e) => setCouleur(e.target.value)} placeholder="Noir" />
        </div>
        <div>
          <Label htmlFor="taille">Taille</Label>
          <Input id="taille" value={taille} onChange={(e) => setTaille(e.target.value)} placeholder="M" />
        </div>
        <div>
          <Label htmlFor="stock">Stock initial</Label>
          <Input id="stock" type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="button" size="sm" disabled={pending} onClick={handleAjouter}>
        {pending ? "Ajout..." : "Ajouter cette variante"}
      </Button>
      <p className="text-xs text-ink-900/40">
        Laisse couleur ou taille vide si le produit n'a qu'une seule dimension de variation (ex : uniquement des tailles, sans couleur).
      </p>
    </Card>
  );
}
