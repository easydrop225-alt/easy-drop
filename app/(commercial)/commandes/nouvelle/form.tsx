"use client";

import { useActionState, useMemo, useState } from "react";
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
  const [prixVente, setPrixVente] = useState(0);
  const [zone, setZone] = useState<ZoneLivraison>("abidjan");

  const produit = useMemo(() => products.find((p) => p.id === productId), [products, productId]);
  const fourchette = zone ? fourchetteFraisParDefaut(zone) : { min: 0, max: 0 };
  const fraisLivraison = fourchette.min;
  const benefice = produit ? calculBeneficeLigne(prixVente, produit.prix_fournisseur, quantite) : 0;
  const horsFourchette = produit ? !estDansFourchette(prixVente, produit.prix_min_conseille, produit.prix_max_conseille) : false;

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
              <Label htmlFor="prixVenteUnitaire">Prix de vente (FCFA)</Label>
              <Input id="prixVenteUnitaire" name="prixVenteUnitaire" type="number" min={0} value={prixVente}
                onChange={(e) => setPrixVente(Number(e.target.value))} required />
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
          <input type="hidden" name="fraisLivraison" value={fraisLivraison} />
          <input type="hidden" name="modeLivraison" value="normal" />
          <p className="text-sm text-ink-900/60">Frais de livraison estimés : {formatFCFA(fraisLivraison)}</p>
        </div>
      </Card>

      <Card className="bg-beige-100">
        <p className="text-sm text-ink-900/60">Bénéfice estimé pour cette commande</p>
        <p className="text-2xl font-semibold text-terracotta-600">{formatFCFA(benefice)}</p>
      </Card>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? "Création en cours..." : "Valider la commande"}
      </Button>
    </form>
  );
}
