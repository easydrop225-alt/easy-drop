"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { creerProduitFournisseur, modifierProduitFournisseur, type ProduitFournisseurInput } from "./actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";
import type { Category, Product } from "@/types/database";

export function ProduitFournisseurForm({
  categories,
  produit,
}: {
  categories: Category[];
  produit?: Product;
}) {
  const router = useRouter();
  const [nom, setNom] = useState(produit?.nom ?? "");
  const [description, setDescription] = useState(produit?.description ?? "");
  const [categoryId, setCategoryId] = useState(produit?.category_id ?? "");
  const [prixBrut, setPrixBrut] = useState(produit?.prix_fournisseur_externe_brut ?? 0);
  const [prixMin, setPrixMin] = useState(produit?.prix_min_conseille ?? 0);
  const [prixMax, setPrixMax] = useState(produit?.prix_max_conseille ?? 0);
  const [couleurs, setCouleurs] = useState(produit?.couleurs?.join(", ") ?? "");
  const [tailles, setTailles] = useState(produit?.tailles?.join(", ") ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleValider() {
    setError(null);
    const input: ProduitFournisseurInput = {
      nom,
      description,
      categoryId: categoryId || null,
      prixFournisseurBrut: prixBrut,
      prixMinConseille: prixMin || undefined,
      prixMaxConseille: prixMax || undefined,
      couleurs: couleurs.split(",").map((c) => c.trim()).filter(Boolean),
      tailles: tailles.split(",").map((t) => t.trim()).filter(Boolean),
    };
    startTransition(async () => {
      const res = produit
        ? await modifierProduitFournisseur(produit.id, input)
        : await creerProduitFournisseur(input);
      if (res?.error) setError(res.error);
      else router.push("/fournisseur/produits");
    });
  }

  return (
    <Card className="space-y-4">
      <div><Label htmlFor="nom">Nom du produit</Label><Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} required /></div>
      <div>
        <Label htmlFor="categoryId">Catégorie</Label>
        <select id="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="h-10 w-full rounded-xl border border-ink-900/10 bg-surface px-3 text-sm">
          <option value="">— Sans catégorie —</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-xl border border-ink-900/10 p-3 text-sm" />
      </div>

      <div className="rounded-xl bg-beige-100 p-3">
        <Label htmlFor="prixBrut">Ton prix (ce que tu factures à Easy Drop)</Label>
        <Input id="prixBrut" type="number" min={0} value={prixBrut || ""} onChange={(e) => setPrixBrut(Number(e.target.value))} required />
        {prixBrut > 0 && (
          <p className="mt-1 text-xs text-ink-900/50">
            Prix affiché aux commerciaux : {formatFCFA(Math.round(prixBrut * 1.1))} (ton prix + frais de plateforme Easy Drop)
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><Label htmlFor="prixMin">Prix de revente min conseillé</Label><Input id="prixMin" type="number" min={0} value={prixMin || ""} onChange={(e) => setPrixMin(Number(e.target.value))} /></div>
        <div><Label htmlFor="prixMax">Prix de revente max conseillé</Label><Input id="prixMax" type="number" min={0} value={prixMax || ""} onChange={(e) => setPrixMax(Number(e.target.value))} /></div>
      </div>
      <div><Label htmlFor="couleurs">Couleurs disponibles (séparées par des virgules)</Label><Input id="couleurs" value={couleurs} onChange={(e) => setCouleurs(e.target.value)} placeholder="Noir, Blanc" /></div>
      <div><Label htmlFor="tailles">Tailles disponibles (séparées par des virgules)</Label><Input id="tailles" value={tailles} onChange={(e) => setTailles(e.target.value)} placeholder="S, M, L" /></div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="button" disabled={pending || !nom || !prixBrut} onClick={handleValider}>
        {pending ? "Enregistrement..." : produit ? "Enregistrer les modifications" : "Soumettre à validation"}
      </Button>
      <p className="text-xs text-ink-900/50">
        {produit ? "Toute modification repart en attente de validation par l'administration." : "Ton produit sera visible aux commerciaux uniquement après validation par l'administration."}
      </p>
    </Card>
  );
}
