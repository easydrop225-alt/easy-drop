"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { modifierVariante, reapprovisionnerStock, modifierStock, supprimerVariante } from "@/app/admin/produits/variantes-actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatFCFA } from "@/lib/utils";
import type { ProductVariant, Inventory, Media } from "@/types/database";

type VariantAvecStock = ProductVariant & { inventory: Inventory[] };

export function libelleVariante(v: Pick<ProductVariant, "nom" | "couleur" | "taille">) {
  return v.nom || [v.couleur, v.taille].filter(Boolean).join(" / ") || "Standard";
}

export function LigneVariante({
  productId,
  variant,
  prixFournisseurProduit,
  image,
  imagesProduit,
  onModifie,
}: {
  productId: string;
  variant: VariantAvecStock;
  prixFournisseurProduit: number;
  image?: string;
  imagesProduit: Media[];
  onModifie: () => void;
}) {
  const inv = variant.inventory?.[0];
  const [ajout, setAjout] = useState(0);
  const [correction, setCorrection] = useState(inv?.quantite_disponible ?? 0);
  const [pending, startTransition] = useTransition();

  const [edition, setEdition] = useState(false);
  const [couleurEd, setCouleurEd] = useState(variant.couleur ?? "");
  const [tailleEd, setTailleEd] = useState(variant.taille ?? "");
  const [nomEd, setNomEd] = useState(variant.nom ?? "");
  const [imageEd, setImageEd] = useState(image ?? "");
  const [prixEd, setPrixEd] = useState(variant.prix_fournisseur != null ? String(variant.prix_fournisseur) : "");
  const [pendingEdition, startTransitionEdition] = useTransition();
  const [erreurEdition, setErreurEdition] = useState<string | null>(null);

  function ouvrirEdition() {
    setCouleurEd(variant.couleur ?? "");
    setTailleEd(variant.taille ?? "");
    setNomEd(variant.nom ?? "");
    setImageEd(image ?? "");
    setPrixEd(variant.prix_fournisseur != null ? String(variant.prix_fournisseur) : "");
    setErreurEdition(null);
    setEdition(true);
  }

  function enregistrerEdition() {
    setErreurEdition(null);
    startTransitionEdition(async () => {
      const res = await modifierVariante(variant.id, productId, {
        couleur: couleurEd,
        taille: tailleEd,
        nom: nomEd,
        imageUrl: imageEd,
        prixFournisseur: prixEd,
      });
      if (res?.error) setErreurEdition(res.error);
      else {
        setEdition(false);
        onModifie();
      }
    });
  }

  if (edition) {
    return (
      <div className="space-y-3 rounded-xl border border-terracotta-200 bg-terracotta-50 p-3 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor={`couleur-ed-${variant.id}`} className="text-xs">Couleur</Label>
            <Input id={`couleur-ed-${variant.id}`} value={couleurEd} onChange={(e) => setCouleurEd(e.target.value)} />
          </div>
          <div>
            <Label htmlFor={`taille-ed-${variant.id}`} className="text-xs">Taille</Label>
            <Input id={`taille-ed-${variant.id}`} value={tailleEd} onChange={(e) => setTailleEd(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor={`nom-ed-${variant.id}`} className="text-xs">Nom affiché (optionnel)</Label>
          <Input id={`nom-ed-${variant.id}`} value={nomEd} onChange={(e) => setNomEd(e.target.value)} />
        </div>
        <div>
          <Label htmlFor={`image-ed-${variant.id}`} className="text-xs">Photo de cette variante</Label>
          <select
            id={`image-ed-${variant.id}`}
            value={imageEd}
            onChange={(e) => setImageEd(e.target.value)}
            className="h-9 w-full rounded-xl border border-ink-900/10 bg-surface px-3 text-sm"
          >
            <option value="">Aucune (utilise la photo générale du produit)</option>
            {imagesProduit.map((img) => (
              <option key={img.id} value={img.url}>
                {img.url.split("/").pop()?.slice(0, 40)}
                {img.product_variant_id && img.product_variant_id !== variant.id ? " (déjà utilisée par une autre variante)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor={`prix-ed-${variant.id}`} className="text-xs">Prix fournisseur (vide = par défaut du produit)</Label>
          <Input
            id={`prix-ed-${variant.id}`}
            type="number"
            min={0}
            value={prixEd}
            onChange={(e) => setPrixEd(e.target.value)}
            placeholder={`Par défaut : ${prixFournisseurProduit}`}
          />
        </div>
        {erreurEdition && <p className="text-xs text-red-600">{erreurEdition}</p>}
        <div className="flex gap-2">
          <Button size="sm" disabled={pendingEdition} onClick={enregistrerEdition}>
            {pendingEdition ? "Enregistrement..." : "Enregistrer"}
          </Button>
          <Button size="sm" variant="secondary" disabled={pendingEdition} onClick={() => setEdition(false)}>
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-beige-100 p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {image && (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
              <Image src={image} alt="" fill sizes="40px" className="object-cover" />
            </div>
          )}
          <div>
            <span className="font-medium">{libelleVariante(variant)}</span>
            <p className="text-xs text-ink-900/50">
              Prix fournisseur : {formatFCFA(variant.prix_fournisseur ?? prixFournisseurProduit)}
              {variant.prix_fournisseur == null && " (par défaut du produit)"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="secondary" onClick={ouvrirEdition}>
            Modifier
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={pending}
            onClick={() => startTransition(() => { supprimerVariante(variant.id, productId); })}
          >
            Suppr.
          </Button>
        </div>
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

