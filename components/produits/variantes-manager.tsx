"use client";

import { useState, useTransition } from "react";
import { ajouterVariante, reapprovisionnerStock, modifierStock, supprimerVariante } from "@/app/admin/produits/variantes-actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { ProductVariant, Inventory } from "@/types/database";

type VariantAvecStock = ProductVariant & { inventory: Inventory[] };

function LigneVariante({ productId, variant }: { productId: string; variant: VariantAvecStock }) {
  const inv = variant.inventory?.[0];
  const [ajout, setAjout] = useState(0);
  const [correction, setCorrection] = useState(inv?.quantite_disponible ?? 0);
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-xl bg-beige-100 p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium">{[variant.couleur, variant.taille].filter(Boolean).join(" / ") || "Standard"}</span>
        <Button
          size="sm"
          variant="danger"
          disabled={pending}
          onClick={() => startTransition(() => { supprimerVariante(variant.id, productId); })}
        >
          Suppr.
        </Button>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-ink-900/50">Stock restant</p>
          <p className="text-lg font-semibold">{inv?.quantite_disponible ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-ink-900/50">Stock écoulé</p>
          <p className="text-lg font-semibold text-red-600">{inv?.stock_ecoule ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-ink-900/50">Total reçu</p>
          <p className="text-lg font-semibold text-ink-900/70">{inv?.stock_total_recu ?? 0}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div>
          <Label htmlFor={`ajout-${variant.id}`} className="text-xs">Réapprovisionner (+)</Label>
          <div className="flex gap-1">
            <Input
              id={`ajout-${variant.id}`}
              type="number"
              min={1}
              value={ajout}
              onChange={(e) => setAjout(Number(e.target.value))}
              className="h-8 w-20"
            />
            <Button
              size="sm"
              disabled={pending || ajout <= 0}
              onClick={() => inv && startTransition(async () => {
                await reapprovisionnerStock(inv.id, productId, ajout);
                setAjout(0);
              })}
            >
              Ajouter
            </Button>
          </div>
        </div>
        <div>
          <Label htmlFor={`correction-${variant.id}`} className="text-xs">Corriger le stock restant à...</Label>
          <div className="flex gap-1">
            <Input
              id={`correction-${variant.id}`}
              type="number"
              min={0}
              value={correction}
              onChange={(e) => setCorrection(Number(e.target.value))}
              className="h-8 w-20"
            />
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => inv && startTransition(() => { modifierStock(inv.id, productId, correction); })}
            >
              Corriger
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      <div>
        <h2 className="font-medium">Variantes (couleur / taille) & stock</h2>
        <p className="mt-1 text-xs text-ink-900/50">
          <strong>Stock restant</strong> = disponible à la vente. <strong>Stock écoulé</strong> = cumul vendu depuis le début.
          <strong> Réapprovisionner</strong> ajoute une quantité au stock restant (nouvel arrivage) sans effacer l&apos;historique.
        </p>
      </div>

      <div className="space-y-3">
        {variants.map((v) => <LigneVariante key={v.id} productId={productId} variant={v} />)}
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
