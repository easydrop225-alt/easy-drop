"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { creerCommande } from "../actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";
import { fourchetteFraisParDefaut } from "@/lib/calculs/calcul-livraison";
import { calculBeneficeLigne, estDansFourchette } from "@/lib/calculs/calcul-benefice";
import type { Product, ZoneLivraison } from "@/types/database";

export function NouvelleCommandeForm({
  products,
  produitPreselectionne,
}: {
  products: Product[];
  produitPreselectionne?: string;
}) {
  const [state, formAction, pending] = useActionState(creerCommande, undefined as { error?: string } | undefined);
  const [productId, setProductId] = useState(produitPreselectionne ?? products[0]?.id ?? "");
  const [quantite, setQuantite] = useState(1);
  const [prixVenteUnitaire, setPrixVenteUnitaire] = useState(0);
  const [zone, setZone] = useState<ZoneLivraison>("abidjan");
  const [prixLivraison, setPrixLivraison] = useState(fourchetteFraisParDefaut("abidjan").min);
  const [livraisonModifieeManuellement, setLivraisonModifieeManuellement] = useState(false);

  const produit = useMemo(() => products.find((p) => p.id === productId), [products, productId]);

  // Pré-remplit une suggestion de frais de livraison quand la zone change,
  // sauf si le commercial a déjà personnalisé le montant lui-même.
  useEffect(() => {
    if (!livraisonModifieeManuellement) {
      setPrixLivraison(fourchetteFraisParDefaut(zone).min);
    }
  }, [zone, livraisonModifieeManuellement]);

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
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-medium">Client</h2>
        <div className="space-y-3">
          <div><Label htmlFor="clientNom">Nom du client</Label><Input id="clientNom" name="clientNom" required /></div>
          <div><Label htmlFor="clientTelephone">Téléphone du client</Label><Input id="clientTelephone" name="clientTelephone" required /></div>
          <div><Label htmlFor="clientCommune">Commune</Label><Input id="clientCommune" name="clientCommune" required /></div>
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
              <option value="hors_abidjan">Hors Abidjan (paiement avant expédition)</option>
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
              Suggestion pour {zone === "abidjan" ? "Abidjan" : "hors Abidjan"} : {formatFCFA(fourchetteFraisParDefaut(zone).min)} – {formatFCFA(fourchetteFraisParDefaut(zone).max)}.
              Tu peux ajuster ce montant ; l'administration pourra aussi le corriger si besoin.
            </p>
          </div>
          <input type="hidden" name="modeLivraison" value="normal" />
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
