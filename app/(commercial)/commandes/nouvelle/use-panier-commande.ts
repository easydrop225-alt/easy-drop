"use client";

import { useMemo, useState } from "react";
import { formatFCFA } from "@/lib/utils";
import { coutFournisseurLignes as coutFournisseurLignesPartage } from "@/lib/calculs/prix-variante";
import type { LignePanierAffichage } from "./panier-commande";
import type { Product, ProductVariant, Inventory } from "@/types/database";

export type VariantAvecStock = ProductVariant & { inventory: Inventory[] };

export interface LigneProduitPanier {
  productId: string;
  quantitesParVariante: Record<string, number>;
  prixVente: number;
}

/**
 * Toute la logique du panier multi-produits : ajout/retrait d'un produit en
 * cours de saisie ("staging"), calcul du bénéfice par ligne et du total,
 * répartition automatique du prix en mode "un seul prix total". Séparé du
 * formulaire principal pour rester lisible — form.tsx ne fait plus que
 * composer l'UI à partir de ce que ce hook expose.
 */
export function usePanierCommande({
  products,
  variants,
  produitPreselectionne,
  imageParVariante,
  imageParProduit,
  modeTarification,
  prixTotalCommande,
  prixLivraison,
}: {
  products: Product[];
  variants: VariantAvecStock[];
  produitPreselectionne?: string;
  imageParVariante?: Record<string, string>;
  imageParProduit?: Record<string, string>;
  modeTarification: "parProduit" | "total";
  prixTotalCommande: number;
  prixLivraison: number;
}) {
  const [panier, setPanier] = useState<LigneProduitPanier[]>([]);

  const productsDisponibles = useMemo(
    () => products.filter((p) => !panier.some((l) => l.productId === p.id)),
    [products, panier]
  );
  const [stagingProductId, setStagingProductId] = useState(produitPreselectionne ?? productsDisponibles[0]?.id ?? "");
  const [stagingQuantites, setStagingQuantites] = useState<Record<string, number>>({});
  const [stagingPrixVente, setStagingPrixVente] = useState(0);

  function selectionnerProduit(id: string) {
    setStagingProductId(id);
    setStagingQuantites({});
    setStagingPrixVente(0);
  }

  const stagingProduit = useMemo(() => products.find((p) => p.id === stagingProductId), [products, stagingProductId]);
  const stagingVariantes = useMemo(
    () => variants.filter((v) => v.product_id === stagingProductId),
    [variants, stagingProductId]
  );

  function setStagingQuantite(cle: string, valeur: number) {
    setStagingQuantites((s) => ({ ...s, [cle]: Math.max(0, valeur) }));
  }

  const stagingLignes = useMemo(() => {
    if (stagingVariantes.length > 0) {
      return stagingVariantes
        .filter((v) => (stagingQuantites[v.id] ?? 0) > 0)
        .map((v) => ({ productVariantId: v.id, quantite: stagingQuantites[v.id] ?? 0 }));
    }
    const q = stagingQuantites["sans_variante"] ?? 0;
    return q > 0 ? [{ productVariantId: null as string | null, quantite: q }] : [];
  }, [stagingVariantes, stagingQuantites]);

  // Certaines variantes ont leur propre prix fournisseur (ex : une taille
  // XXL qui coûte plus cher à produire) — logique centralisée dans
  // lib/calculs/prix-variante.ts (partagée avec l'action serveur).
  function coutFournisseurLignes(
    lignes: { productVariantId: string | null; quantite: number }[],
    prixFournisseurParDefaut: number
  ) {
    return coutFournisseurLignesPartage(
      lignes,
      prixFournisseurParDefaut,
      (variantId) => variants.find((v) => v.id === variantId)?.prix_fournisseur
    );
  }

  const stagingQuantiteTotale = stagingLignes.reduce((a, l) => a + l.quantite, 0);
  const stagingPrixUnitaireMoyen = stagingQuantiteTotale > 0 ? stagingPrixVente / stagingQuantiteTotale : 0;
  const stagingBenefice = stagingProduit
    ? stagingPrixVente - coutFournisseurLignes(stagingLignes, stagingProduit.prix_fournisseur)
    : 0;
  const stagingHorsFourchette =
    stagingProduit && stagingProduit.prix_min_conseille != null && stagingProduit.prix_max_conseille != null && stagingQuantiteTotale > 0
      ? stagingPrixUnitaireMoyen < stagingProduit.prix_min_conseille || stagingPrixUnitaireMoyen > stagingProduit.prix_max_conseille
      : false;

  function ajouterAuPanier() {
    if (!stagingProductId || stagingLignes.length === 0) return;
    if (modeTarification === "parProduit" && stagingPrixVente <= 0) return;
    setPanier((p) => [...p, { productId: stagingProductId, quantitesParVariante: { ...stagingQuantites }, prixVente: stagingPrixVente }]);
    // Réinitialise la zone de saisie pour le prochain produit à ajouter.
    setStagingQuantites({});
    setStagingPrixVente(0);
    const prochainDisponible = products.find((p) => p.id !== stagingProductId && !panier.some((l) => l.productId === p.id));
    setStagingProductId(prochainDisponible?.id ?? "");
  }

  function retirerDuPanier(index: number) {
    setPanier((p) => p.filter((_, i) => i !== index));
  }

  function lignesPourProduit(ligne: LigneProduitPanier) {
    const variantesDuProduit = variants.filter((v) => v.product_id === ligne.productId);
    if (variantesDuProduit.length > 0) {
      return variantesDuProduit
        .filter((v) => (ligne.quantitesParVariante[v.id] ?? 0) > 0)
        .map((v) => ({ productVariantId: v.id, quantite: ligne.quantitesParVariante[v.id] ?? 0 }));
    }
    const q = ligne.quantitesParVariante["sans_variante"] ?? 0;
    return q > 0 ? [{ productVariantId: null as string | null, quantite: q }] : [];
  }

  const quantiteTotalePanierBrute = panier.reduce(
    (a, ligne) => a + lignesPourProduit(ligne).reduce((x, l) => x + l.quantite, 0),
    0
  );
  // En mode "prix total", le commercial saisit UN seul montant qui couvre
  // déjà les produits ET la livraison (comme le client le paierait en une
  // fois). On en déduit d'abord la part "produits" (montant saisi moins la
  // livraison, déjà connue selon la zone/commune choisie), puis on répartit
  // cette part entre les produits au prorata des quantités.
  const prixProduitsSeuls = Math.max(0, prixTotalCommande - prixLivraison);
  const prixVenteUnitaireMoyenGlobal =
    modeTarification === "total" && quantiteTotalePanierBrute > 0 ? prixProduitsSeuls / quantiteTotalePanierBrute : 0;

  const produitsJson = useMemo(
    () =>
      panier.map((ligne) => {
        const lignes = lignesPourProduit(ligne);
        const qteProduit = lignes.reduce((x, l) => x + l.quantite, 0);
        const prixVente = modeTarification === "total" ? prixVenteUnitaireMoyenGlobal * qteProduit : ligne.prixVente;
        return { productId: ligne.productId, lignes, prixVente };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [panier, modeTarification, prixVenteUnitaireMoyenGlobal]
  );

  const quantiteTotalePanier = quantiteTotalePanierBrute;
  const prixVenteTotalPanier = modeTarification === "total" ? prixProduitsSeuls : panier.reduce((a, l) => a + l.prixVente, 0);
  const beneficeTotalPanier = panier.reduce((a, ligne) => {
    const produit = products.find((p) => p.id === ligne.productId);
    const lignesDeCeProduit = lignesPourProduit(ligne);
    const qte = lignesDeCeProduit.reduce((x, l) => x + l.quantite, 0);
    const prixVente = modeTarification === "total" ? prixVenteUnitaireMoyenGlobal * qte : ligne.prixVente;
    return a + (produit ? prixVente - coutFournisseurLignes(lignesDeCeProduit, produit.prix_fournisseur) : 0);
  }, 0);
  const prixTotalAvecLivraison = modeTarification === "total" ? prixTotalCommande : prixVenteTotalPanier + prixLivraison;

  const lignesPanierAffichage: LignePanierAffichage[] = panier.map((ligne, index) => {
    const produit = products.find((p) => p.id === ligne.productId);
    const lignesDuProduit = lignesPourProduit(ligne);
    const qte = lignesDuProduit.reduce((x, l) => x + l.quantite, 0);
    const prixVenteLigne = modeTarification === "total" ? prixVenteUnitaireMoyenGlobal * qte : ligne.prixVente;
    const benefice = produit ? prixVenteLigne - coutFournisseurLignes(lignesDuProduit, produit.prix_fournisseur) : 0;
    // Miniature représentative de la ligne : photo de la première variante
    // choisie si elle en a une, sinon photo générale du produit.
    const premiereVarianteId = lignesDuProduit[0]?.productVariantId;
    const photo = (premiereVarianteId && imageParVariante?.[premiereVarianteId]) || imageParProduit?.[ligne.productId];
    const detail =
      `${qte} pièce${qte > 1 ? "s" : ""}` +
      (modeTarification === "parProduit"
        ? ` · ${formatFCFA(prixVenteLigne)} · bénéfice ${formatFCFA(benefice)}`
        : prixTotalCommande > 0
          ? ` · part du prix total : ${formatFCFA(prixVenteLigne)}`
          : " · en attente du prix total");
    return { cle: `${ligne.productId}-${index}`, nomProduit: produit?.nom ?? "Produit", quantite: qte, photo, detail };
  });

  return {
    panier,
    setPanier,
    productsDisponibles,
    stagingProductId,
    selectionnerProduit,
    stagingQuantites,
    setStagingQuantite,
    stagingPrixVente,
    setStagingPrixVente,
    stagingProduit,
    stagingVariantes,
    stagingQuantiteTotale,
    stagingBenefice,
    stagingHorsFourchette,
    ajouterAuPanier,
    retirerDuPanier,
    lignesPanierAffichage,
    produitsJson,
    quantiteTotalePanier,
    prixProduitsSeuls,
    prixVenteTotalPanier,
    prixTotalAvecLivraison,
    beneficeTotalPanier,
  };
}
