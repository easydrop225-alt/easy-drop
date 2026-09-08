"use client";

import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";
import { fourchetteFraisParDefaut } from "@/lib/calculs/calcul-livraison";
import type { ZoneLivraison } from "@/types/database";

/**
 * Affichage pur du bloc livraison — un seul frais pour toute la commande,
 * quel que soit le nombre de produits différents.
 */
export function LivraisonCard({
  zone,
  onZoneChange,
  prixLivraison,
  onPrixLivraisonChange,
  gare,
  onGareChange,
  villeExpedition,
  onVilleExpeditionChange,
}: {
  zone: ZoneLivraison;
  onZoneChange: (v: ZoneLivraison) => void;
  prixLivraison: number;
  onPrixLivraisonChange: (v: number) => void;
  gare: string;
  onGareChange: (v: string) => void;
  villeExpedition: string;
  onVilleExpeditionChange: (v: string) => void;
}) {
  return (
    <Card>
      <h2 className="mb-4 font-medium">Livraison</h2>
      <p className="mb-3 text-xs text-ink-900/50">
        Un seul frais de livraison pour toute la commande, quel que soit le nombre de produits différents ci-dessus.
      </p>
      <div className="space-y-3">
        <div>
          <Label htmlFor="zone">Zone</Label>
          <select id="zone" name="zone" value={zone} onChange={(e) => onZoneChange(e.target.value as ZoneLivraison)}
            className="h-10 w-full rounded-xl border border-ink-900/10 bg-surface px-3 text-sm">
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
            value={prixLivraison || ""}
            onChange={(e) => onPrixLivraisonChange(Number(e.target.value))}
            required
          />
          <p className="mt-1 text-xs text-ink-900/50">
            {zone === "abidjan"
              ? "Le tarif se met à jour automatiquement selon la commune choisie ci-dessus. Tu peux aussi l'ajuster manuellement."
              : `Suggestion hors Abidjan : ${formatFCFA(fourchetteFraisParDefaut(zone).min)} – ${formatFCFA(fourchetteFraisParDefaut(zone).max)}.`}
          </p>
        </div>

        {zone === "hors_abidjan" && (
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-beige-100 p-3">
            <div>
              <Label htmlFor="gare">Gare (point de dépôt)</Label>
              <Input id="gare" name="gare" value={gare} onChange={(e) => onGareChange(e.target.value)} placeholder="Ex : Gare UTB Yamoussoukro" />
            </div>
            <div>
              <Label htmlFor="villeExpedition">Ville de destination</Label>
              <Input id="villeExpedition" name="villeExpedition" value={villeExpedition} onChange={(e) => onVilleExpeditionChange(e.target.value)} placeholder="Ex : Yamoussoukro" />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
