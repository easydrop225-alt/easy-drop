"use client";

import { useActionState } from "react";
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

  return (
    <form action={formAction} className="space-y-4">
      <Card className="space-y-4">
        <div><Label htmlFor="nom">Nom du produit</Label><Input id="nom" name="nom" defaultValue={produit?.nom} required /></div>
        <div>
          <Label htmlFor="categoryId">Catégorie</Label>
          <select id="categoryId" name="categoryId" defaultValue={produit?.category_id ?? ""} className="h-10 w-full rounded-xl border border-ink-900/10 bg-white px-3 text-sm">
            {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <div><Label htmlFor="description">Description</Label>
          <textarea id="description" name="description" rows={4} defaultValue={produit?.description ?? ""} className="w-full rounded-xl border border-ink-900/10 p-3 text-sm" />
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
