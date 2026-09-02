"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ajouterVariante } from "@/app/admin/produits/variantes-actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { LigneVariante } from "./ligne-variante";
import type { ProductVariant, Inventory, Media } from "@/types/database";

type VariantAvecStock = ProductVariant & { inventory: Inventory[] };

export function VariantesManager({
  productId,
  variants,
  prixFournisseurProduit,
}: {
  productId: string;
  variants: VariantAvecStock[];
  prixFournisseurProduit: number;
}) {
  const [formulaireOuvert, setFormulaireOuvert] = useState(variants.length === 0);
  const [couleur, setCouleur] = useState("");
  const [taille, setTaille] = useState("");
  const [nom, setNom] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [prixFournisseur, setPrixFournisseur] = useState("");
  const [stock, setStock] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [groupeOuvert, setGroupeOuvert] = useState(false);
  const [couleursGroupees, setCouleursGroupees] = useState("");
  const [taillesGroupees, setTaillesGroupees] = useState("");
  const [stockGroupe, setStockGroupe] = useState(0);
  const [pendingGroupe, startTransitionGroupe] = useTransition();
  const [resultatGroupe, setResultatGroupe] = useState<string | null>(null);

  const [imagesProduit, setImagesProduit] = useState<Media[]>([]);
  const supabase = createClient();

  const chargerImages = useCallback(async () => {
    const { data } = await supabase.from("media").select("*").eq("product_id", productId).eq("type", "image").order("ordre");
    setImagesProduit((data ?? []) as Media[]);
  }, [productId, supabase]);

  useEffect(() => {
    chargerImages();
  }, [chargerImages]);

  const imageParVariantId = new Map<string, string>();
  for (const img of imagesProduit) {
    if (img.product_variant_id && !imageParVariantId.has(img.product_variant_id)) {
      imageParVariantId.set(img.product_variant_id, img.url);
    }
  }

  function handleAjouter() {
    setError(null);
    startTransition(async () => {
      const res = await ajouterVariante(productId, couleur, taille, stock, {
        nom: nom || undefined,
        imageUrl: imageUrl || undefined,
        prixFournisseur: prixFournisseur ? Number(prixFournisseur) : undefined,
      });
      if (res?.error) {
        setError(res.error);
      } else {
        setCouleur(""); setTaille(""); setNom(""); setImageUrl(""); setPrixFournisseur(""); setStock(0);
        chargerImages();
        setFormulaireOuvert(false);
      }
    });
  }

  function handleGenererCombinaisons() {
    const couleursListe = couleursGroupees.split(",").map((c) => c.trim()).filter(Boolean);
    const taillesListe = taillesGroupees.split(",").map((t) => t.trim()).filter(Boolean);

    const combinaisons: { couleur: string; taille: string }[] =
      couleursListe.length > 0 && taillesListe.length > 0
        ? couleursListe.flatMap((c) => taillesListe.map((t) => ({ couleur: c, taille: t })))
        : couleursListe.length > 0
          ? couleursListe.map((c) => ({ couleur: c, taille: "" }))
          : taillesListe.map((t) => ({ couleur: "", taille: t }));

    if (combinaisons.length === 0) {
      setResultatGroupe("Indique au moins une couleur ou une taille.");
      return;
    }

    setResultatGroupe(null);
    startTransitionGroupe(async () => {
      const resultats = await Promise.all(
        combinaisons.map((c) => ajouterVariante(productId, c.couleur, c.taille, stockGroupe))
      );
      const echecs = resultats.filter((r) => r?.error).length;
      const reussies = combinaisons.length - echecs;
      setResultatGroupe(
        echecs === 0
          ? `${reussies} variante${reussies > 1 ? "s" : ""} créée${reussies > 1 ? "s" : ""} ✓`
          : `${reussies} créée(s), ${echecs} échec(s) (peut-être déjà existantes)`
      );
      setCouleursGroupees("");
      setTaillesGroupees("");
      setStockGroupe(0);
      chargerImages();
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
        {variants.map((v) => (
          <LigneVariante
            key={v.id}
            productId={productId}
            variant={v}
            prixFournisseurProduit={prixFournisseurProduit}
            image={imageParVariantId.get(v.id)}
            imagesProduit={imagesProduit}
            onModifie={chargerImages}
          />
        ))}
        {variants.length === 0 && !formulaireOuvert && (
          <p className="text-sm text-ink-900/50">Aucune variante pour ce produit.</p>
        )}
      </div>

      {!formulaireOuvert ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setFormulaireOuvert(true)}
            className="w-full rounded-xl border border-dashed border-ink-900/15 py-2.5 text-sm font-medium text-ink-900/60 hover:border-terracotta-300 hover:text-terracotta-600"
          >
            + Ajouter une variante
          </button>
          <button
            type="button"
            onClick={() => setGroupeOuvert(!groupeOuvert)}
            className="w-full rounded-xl border border-dashed border-ink-900/15 py-2 text-xs font-medium text-ink-900/50 hover:border-terracotta-300 hover:text-terracotta-600"
          >
            {groupeOuvert ? "▲ Fermer" : "+ Générer plusieurs variantes (couleur × taille)"}
          </button>
          {groupeOuvert && (
            <div className="space-y-2 rounded-xl bg-terracotta-50 p-3">
              <p className="text-xs text-ink-900/50">
                Sépare chaque valeur par une virgule. Toutes les combinaisons couleur × taille seront créées automatiquement.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="couleursGroupees" className="text-xs">Couleurs</Label>
                  <Input id="couleursGroupees" value={couleursGroupees} onChange={(e) => setCouleursGroupees(e.target.value)} placeholder="Noir, Blanc, Rouge" />
                </div>
                <div>
                  <Label htmlFor="taillesGroupees" className="text-xs">Tailles</Label>
                  <Input id="taillesGroupees" value={taillesGroupees} onChange={(e) => setTaillesGroupees(e.target.value)} placeholder="S, M, L" />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <div>
                  <Label htmlFor="stockGroupe" className="text-xs">Stock initial (chaque variante)</Label>
                  <Input id="stockGroupe" type="number" min={0} value={stockGroupe} onChange={(e) => setStockGroupe(Number(e.target.value))} className="w-32" />
                </div>
                <Button type="button" size="sm" disabled={pendingGroupe} onClick={handleGenererCombinaisons}>
                  {pendingGroupe ? "Génération..." : "Générer"}
                </Button>
              </div>
              {resultatGroupe && <p className="text-xs text-ink-900/70">{resultatGroupe}</p>}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3 border-t border-ink-900/5 pt-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="couleur">Couleur</Label>
              <Input id="couleur" value={couleur} onChange={(e) => setCouleur(e.target.value)} placeholder="Noir" />
            </div>
            <div>
              <Label htmlFor="taille">Taille</Label>
              <Input id="taille" value={taille} onChange={(e) => setTaille(e.target.value)} placeholder="M" />
            </div>
          </div>
          <div>
            <Label htmlFor="nomVariante">Nom affiché (optionnel)</Label>
            <Input id="nomVariante" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : Édition limitée (sinon Couleur / Taille par défaut)" />
          </div>
          <div>
            <Label htmlFor="imageVariante">Photo de cette variante (parmi celles déjà téléchargées)</Label>
            <select
              id="imageVariante"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="h-10 w-full rounded-xl border border-ink-900/10 bg-surface px-3 text-sm"
            >
              <option value="">Aucune (utilise la photo générale du produit)</option>
              {imagesProduit.map((img) => (
                <option key={img.id} value={img.url}>
                  {img.url.split("/").pop()?.slice(0, 40)}{img.product_variant_id ? " (déjà utilisée par une autre variante)" : ""}
                </option>
              ))}
            </select>
            {imagesProduit.length === 0 && (
              <p className="mt-1 text-xs text-ink-900/40">Aucune photo téléchargée pour l&apos;instant — ajoute-en d&apos;abord ci-dessus.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="prixFournisseurVariante">Prix fournisseur (optionnel)</Label>
              <Input
                id="prixFournisseurVariante"
                type="number"
                min={0}
                value={prixFournisseur}
                onChange={(e) => setPrixFournisseur(e.target.value)}
                placeholder={`Par défaut : ${prixFournisseurProduit}`}
              />
            </div>
            <div>
              <Label htmlFor="stock">Stock initial</Label>
              <Input id="stock" type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={pending} onClick={handleAjouter}>
              {pending ? "Ajout..." : "Ajouter cette variante"}
            </Button>
            {variants.length > 0 && (
              <Button type="button" size="sm" variant="secondary" onClick={() => setFormulaireOuvert(false)}>
                Annuler
              </Button>
            )}
          </div>
          <p className="text-xs text-ink-900/40">
            Laisse couleur ou taille vide si le produit n'a qu'une seule dimension de variation (ex : uniquement des tailles, sans couleur).
          </p>
        </div>
      )}
    </Card>
  );
}
