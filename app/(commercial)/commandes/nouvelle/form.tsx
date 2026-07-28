"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { creerCommande } from "../actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";
import { fourchetteFraisParDefaut } from "@/lib/calculs/calcul-livraison";
import { calculBeneficeLigne, estDansFourchette } from "@/lib/calculs/calcul-benefice";
import { COMMUNES_ABIDJAN, tarifPourCommune } from "@/lib/data/communes-abidjan";
import type { Product, ProductVariant, Inventory, ZoneLivraison } from "@/types/database";

type VariantAvecStock = ProductVariant & { inventory: Inventory[] };

export function NouvelleCommandeForm({
  products,
  variants,
  produitPreselectionne,
}: {
  products: Product[];
  variants: VariantAvecStock[];
  produitPreselectionne?: string;
}) {
  const [state, formAction, pending] = useActionState(creerCommande, undefined as { error?: string } | undefined);
  const [productId, setProductId] = useState(produitPreselectionne ?? products[0]?.id ?? "");
  const [productVariantId, setProductVariantId] = useState("");
  const [quantite, setQuantite] = useState(1);
  const [prixVenteUnitaire, setPrixVenteUnitaire] = useState(0);
  const [zone, setZone] = useState<ZoneLivraison>("abidjan");
  const [commune, setCommune] = useState("");
  const [prixLivraison, setPrixLivraison] = useState(fourchetteFraisParDefaut("abidjan").min);
  const [livraisonModifieeManuellement, setLivraisonModifieeManuellement] = useState(false);

  const produit = useMemo(() => products.find((p) => p.id === productId), [products, productId]);
  const variantesDuProduit = useMemo(() => variants.filter((v) => v.product_id === productId), [variants, productId]);
  const varianteSelectionnee = useMemo(
    () => variantesDuProduit.find((v) => v.id === productVariantId),
    [variantesDuProduit, productVariantId]
  );
  const stockDisponible = varianteSelectionnee?.inventory?.[0]?.quantite_disponible;

  // Dès que le produit change, on sélectionne automatiquement sa première
  // variante disponible (s'il en a) pour que le stock soit toujours suivi.
  useEffect(() => {
    const premiereDispo = variantesDuProduit.find((v) => (v.inventory?.[0]?.quantite_disponible ?? 0) > 0) ?? variantesDuProduit[0];
    setProductVariantId(premiereDispo?.id ?? "");
  }, [productId, variantesDuProduit]);

  // Pré-remplit une suggestion de frais de livraison quand la zone change,
  // sauf si le commercial a déjà personnalisé le montant lui-même.
  useEffect(() => {
    if (!livraisonModifieeManuellement) {
      setPrixLivraison(fourchetteFraisParDefaut(zone).min);
    }
  }, [zone, livraisonModifieeManuellement]);

  // Dès que la commune saisie correspond exactement à une commune connue
  // (via la liste déroulante/autocomplétion), le prix de la livraison se
  // met à jour automatiquement selon son tarif.
  function handleCommuneChange(valeur: string) {
    setCommune(valeur);
    const tarif = tarifPourCommune(valeur);
    if (tarif != null) {
      setPrixLivraison(tarif);
      setLivraisonModifieeManuellement(false);
    }
  }

  const prixVenteTotal = prixVenteUnitaire * quantite;
  const prixTotal = prixVenteTotal + prixLivraison;
  // Bénéfice = Prix total - Prix livraison - Prix fournisseur = Prix de vente - Prix fournisseur.
  const benefice = produit ? calculBeneficeLigne(prixVenteUnitaire, produit.prix_fournisseur, quantite) : 0;
  const horsFourchette = produit ? !estDansFourchette(prixVenteUnitaire, produit.prix_min_conseille, produit.prix_max_conseille) : false;

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <h2 className="mb-4 font-medium">Produit</h2>
        <div className="space-y-3">
          <div>
            <Label htmlFor="productId">Produit</Label>
            <select
              id="productId"
              name="productId"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="h-10 w-full rounded-xl border border-ink-900/10 bg-white px-3 text-sm"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.nom} — {formatFCFA(p.prix_fournisseur)}</option>
              ))}
            </select>
          </div>
          {variantesDuProduit.length > 0 && (
            <div>
              <Label htmlFor="productVariantId">Variante (couleur / taille)</Label>
              <select
                id="productVariantId"
                name="productVariantId"
                value={productVariantId}
                onChange={(e) => setProductVariantId(e.target.value)}
                className="h-10 w-full rounded-xl border border-ink-900/10 bg-white px-3 text-sm"
                required
              >
                {variantesDuProduit.map((v) => {
                  const stock = v.inventory?.[0]?.quantite_disponible ?? 0;
                  const label = [v.couleur, v.taille].filter(Boolean).join(" / ") || "Standard";
                  return (
                    <option key={v.id} value={v.id} disabled={stock <= 0}>
                      {label} — {stock > 0 ? `${stock} en stock` : "Rupture de stock"}
                    </option>
                  );
                })}
              </select>
              {stockDisponible != null && quantite > stockDisponible && (
                <p className="mt-1 text-xs text-red-600">
                  Attention : seulement {stockDisponible} en stock pour cette variante.
                </p>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="quantite">Quantité</Label>
              <Input id="quantite" name="quantite" type="number" min={1} value={quantite}
                onChange={(e) => setQuantite(Number(e.target.value))} required />
            </div>
            <div>
              <Label htmlFor="prixVenteUnitaire">Prix de vente unitaire (FCFA, sans la livraison)</Label>
              <Input id="prixVenteUnitaire" name="prixVenteUnitaire" type="number" min={0} value={prixVenteUnitaire}
                onChange={(e) => setPrixVenteUnitaire(Number(e.target.value))} required />
            </div>
          </div>
          {horsFourchette && (
            <p className="text-xs text-amber-600">
              Ce prix sort de la fourchette conseillée ({formatFCFA(produit?.prix_min_conseille ?? 0)} – {formatFCFA(produit?.prix_max_conseille ?? 0)}).
            </p>
          )}
          <div>
            <Label htmlFor="observation">Observation (couleur, taille, précisions...)</Label>
            <textarea
              id="observation"
              name="observation"
              rows={2}
              placeholder="Ex : Couleur noire, taille M"
              className="w-full rounded-xl border border-ink-900/10 p-3 text-sm"
            />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-medium">Client</h2>
        <div className="space-y-3">
          <div><Label htmlFor="clientNom">Nom du client</Label><Input id="clientNom" name="clientNom" required /></div>
          <div><Label htmlFor="clientTelephone">Téléphone du client</Label><Input id="clientTelephone" name="clientTelephone" required /></div>
          <div>
            <Label htmlFor="clientCommune">Commune</Label>
            <Input
              id="clientCommune"
              name="clientCommune"
              list="communes-liste"
              value={commune}
              onChange={(e) => handleCommuneChange(e.target.value)}
              placeholder="Commence à écrire pour voir les suggestions..."
              autoComplete="off"
              required
            />
            <datalist id="communes-liste">
              {COMMUNES_ABIDJAN.map((c) => (
                <option key={c.commune} value={c.commune} />
              ))}
            </datalist>
          </div>
          <div><Label htmlFor="clientAdresse">Adresse complète</Label><Input id="clientAdresse" name="clientAdresse" required /></div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-medium">Livraison</h2>
        <div className="space-y-3">
          <div>
            <Label htmlFor="zone">Zone</Label>
            <select id="zone" name="zone" value={zone} onChange={(e) => setZone(e.target.value as ZoneLivraison)}
              className="h-10 w-full rounded-xl border border-ink-900/10 bg-white px-3 text-sm">
              <option value="abidjan">Abidjan (paiement à la livraison)</option>
              <option value="hors_abidjan">Hors Abidjan / Expédition (paiement avant expédition)</option>
            </select>
          </div>
          <div>
            <Label htmlFor="fraisLivraison">Prix de la livraison (FCFA)</Label>
            <Input
              id="fraisLivraison"
              name="fraisLivraison"
              type="number"
              min={0}
              value={prixLivraison}
              onChange={(e) => { setPrixLivraison(Number(e.target.value)); setLivraisonModifieeManuellement(true); }}
              required
            />
            <p className="mt-1 text-xs text-ink-900/50">
              {zone === "abidjan"
                ? "Le tarif se met à jour automatiquement selon la commune choisie ci-dessus. Tu peux aussi l'ajuster manuellement."
                : `Suggestion hors Abidjan : ${formatFCFA(fourchetteFraisParDefaut(zone).min)} – ${formatFCFA(fourchetteFraisParDefaut(zone).max)}.`}
            </p>
          </div>
          <input type="hidden" name="modeLivraison" value="normal" />

          {zone === "hors_abidjan" && (
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-beige-100 p-3">
              <div>
                <Label htmlFor="gare">Gare (point de dépôt)</Label>
                <Input id="gare" name="gare" placeholder="Ex : Gare UTB Yamoussoukro" />
              </div>
              <div>
                <Label htmlFor="villeExpedition">Ville de destination</Label>
                <Input id="villeExpedition" name="villeExpedition" placeholder="Ex : Yamoussoukro" />
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="space-y-2 bg-beige-100">
        <div className="flex justify-between text-sm">
          <span className="text-ink-900/60">Prix de vente</span>
          <span>{formatFCFA(prixVenteTotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-900/60">Prix de la livraison</span>
          <span>{formatFCFA(prixLivraison)}</span>
        </div>
        <div className="flex justify-between border-t border-ink-900/10 pt-2 font-medium">
          <span>Prix total (payé par le client)</span>
          <span>{formatFCFA(prixTotal)}</span>
        </div>
        <div className="mt-3 border-t border-ink-900/10 pt-3">
          <p className="text-sm text-ink-900/60">Bénéfice estimé pour cette commande</p>
          <p className="text-2xl font-semibold text-terracotta-600">{formatFCFA(benefice)}</p>
        </div>
      </Card>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? "Création en cours..." : "Valider la commande"}
      </Button>
    </form>
  );
}
