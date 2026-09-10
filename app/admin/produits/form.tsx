"use client";

import { useActionState, useState } from "react";
import { creerProduit } from "./actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Category, Product } from "@/types/database";

type ProduitAction = (prevState: unknown, formData: FormData) => Promise<{ error?: string } | void>;

export function ProduitForm({
  categories,
  produit,
  action = creerProduit,
  submitLabel = "Créer le produit",
}: {
  categories: Category[];
  produit?: Product;
  action?: ProduitAction;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined as { error?: string } | undefined);
  const [typeOffre, setTypeOffre] = useState<"unique" | "lot">(produit?.type_offre ?? "unique");

  return (
    <form action={formAction} className="space-y-4">
      <Card className="space-y-4">
        <div><Label htmlFor="nom">Nom du produit</Label><Input id="nom" name="nom" defaultValue={produit?.nom} required /></div>
        <div>
          <Label htmlFor="categoryId">Catégorie</Label>
          <select id="categoryId" name="categoryId" defaultValue={produit?.category_id ?? ""} className="h-10 w-full rounded-xl border border-ink-900/10 bg-surface px-3 text-sm">
            {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <div><Label htmlFor="description">Description</Label>
          <textarea id="description" name="description" rows={4} defaultValue={produit?.description ?? ""} className="w-full rounded-xl border border-ink-900/10 p-3 text-sm" />
        </div>

        {/* Vendu à la pièce ou par lot — n'affecte pas le volet Variantes,
            qui reste identique quel que soit le choix ici. */}
        <div>
          <Label>Ce produit se vend...</Label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTypeOffre("unique")}
              className={`rounded-xl border p-3 text-left text-sm transition ${
                typeOffre === "unique" ? "border-terracotta-500 bg-terracotta-50" : "border-ink-900/10"
              }`}
            >
              <p className="font-medium">Pièce unique</p>
              <p className="text-xs text-ink-900/50">Vendu à l&apos;unité.</p>
            </button>
            <button
              type="button"
              onClick={() => setTypeOffre("lot")}
              className={`rounded-xl border p-3 text-left text-sm transition ${
                typeOffre === "lot" ? "border-terracotta-500 bg-terracotta-50" : "border-ink-900/10"
              }`}
            >
              <p className="font-medium">Par lot</p>
              <p className="text-xs text-ink-900/50">Ex : lot de 3 cintres.</p>
            </button>
          </div>
          <input type="hidden" name="typeOffre" value={typeOffre} />
          {typeOffre === "lot" && (
            <div className="mt-2">
              <Label htmlFor="quantiteParLot">Nombre de pièces par lot</Label>
              <Input
                id="quantiteParLot"
                name="quantiteParLot"
                type="number"
                min={2}
                defaultValue={produit?.quantite_par_lot ?? undefined}
                placeholder="Ex : 3"
                required
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div><Label htmlFor="prixFournisseur">Prix fournisseur</Label><Input id="prixFournisseur" name="prixFournisseur" type="number" defaultValue={produit?.prix_fournisseur} required /></div>
          <div><Label htmlFor="prixMinConseille">Prix min conseillé</Label><Input id="prixMinConseille" name="prixMinConseille" type="number" defaultValue={produit?.prix_min_conseille ?? undefined} /></div>
          <div><Label htmlFor="prixMaxConseille">Prix max conseillé</Label><Input id="prixMaxConseille" name="prixMaxConseille" type="number" defaultValue={produit?.prix_max_conseille ?? undefined} /></div>
        </div>
        <div><Label htmlFor="couleurs">Couleurs (séparées par des virgules)</Label><Input id="couleurs" name="couleurs" placeholder="Noir, Beige, Blanc" defaultValue={produit?.couleurs?.join(", ")} /></div>
        <div><Label htmlFor="tailles">Tailles (séparées par des virgules)</Label><Input id="tailles" name="tailles" placeholder="S, M, L, XL" defaultValue={produit?.tailles?.join(", ")} /></div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="actif" defaultChecked={produit?.actif ?? true} /> Produit actif
        </label>
      </Card>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Enregistrement..." : submitLabel}</Button>
    </form>
  );
}
