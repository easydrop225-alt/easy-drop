"use client";

import { useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";
import { fourchetteFraisParDefaut } from "@/lib/calculs/calcul-livraison";
import { COMMUNES_ABIDJAN } from "@/lib/data/communes-abidjan";
import type { ZoneLivraison } from "@/types/database";

/**
 * "Lieu de livraison" (commune + adresse détaillée, ou gare + ville pour
 * l'expédition hors Abidjan) et "Prix de la livraison" affichés côte à
 * côte — un seul frais pour toute la commande, quel que soit le nombre de
 * produits différents ci-dessus.
 */
export function LieuLivraisonCard({
  zone,
  onZoneChange,
  commune,
  onCommuneChange,
  clientAdresse,
  onClientAdresseChange,
  prixLivraison,
  onPrixLivraisonChange,
  gare,
  onGareChange,
  villeExpedition,
  onVilleExpeditionChange,
}: {
  zone: ZoneLivraison;
  onZoneChange: (v: ZoneLivraison) => void;
  commune: string;
  onCommuneChange: (v: string) => void;
  clientAdresse: string;
  onClientAdresseChange: (v: string) => void;
  prixLivraison: number;
  onPrixLivraisonChange: (v: number) => void;
  gare: string;
  onGareChange: (v: string) => void;
  villeExpedition: string;
  onVilleExpeditionChange: (v: string) => void;
}) {
  // Le <datalist> HTML natif n'est pas du tout pris en charge par Safari
  // sur iOS (aucune suggestion ne s'affiche jamais) — remplacé par une
  // vraie liste déroulante gérée nous-mêmes, qui fonctionne partout.
  const [listeOuverte, setListeOuverte] = useState(false);
  const communesFiltrees = COMMUNES_ABIDJAN.filter((c) =>
    c.commune.toLowerCase().includes(commune.trim().toLowerCase())
  );

  return (
    <Card>
      <h2 className="mb-3 font-medium">Livraison</h2>
      <div className="mb-3">
        <Label htmlFor="zone">Zone</Label>
        <select
          id="zone"
          name="zone"
          value={zone}
          onChange={(e) => onZoneChange(e.target.value as ZoneLivraison)}
          className="h-10 w-full rounded-xl border border-ink-900/10 bg-surface px-3 text-sm"
        >
          <option value="abidjan">Abidjan (paiement à la livraison)</option>
          <option value="hors_abidjan">Hors Abidjan / Expédition (paiement avant expédition)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Lieu de livraison */}
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-900/50">
            Lieu de livraison ({zone === "abidjan" ? "commune et adresse détaillée" : "gare et ville"})
          </p>
          {zone === "abidjan" ? (
            <>
              <div className="relative">
                <Label htmlFor="clientCommune">Commune</Label>
                <Input
                  id="clientCommune"
                  name="clientCommune"
                  value={commune}
                  onChange={(e) => { onCommuneChange(e.target.value); setListeOuverte(true); }}
                  onFocus={() => setListeOuverte(true)}
                  onBlur={() => setTimeout(() => setListeOuverte(false), 150)}
                  placeholder="Commence à écrire pour voir les suggestions..."
                  autoComplete="off"
                  required
                />
                {listeOuverte && communesFiltrees.length > 0 && (
                  <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-ink-900/10 bg-surface shadow-lg">
                    {communesFiltrees.map((c) => (
                      <button
                        key={c.commune}
                        type="button"
                        onClick={() => { onCommuneChange(c.commune); setListeOuverte(false); }}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-beige-100"
                      >
                        {c.commune}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="clientAdresse">Adresse détaillée</Label>
                <Input id="clientAdresse" name="clientAdresse" value={clientAdresse} onChange={(e) => onClientAdresseChange(e.target.value)} required />
              </div>
            </>
          ) : (
            <div className="space-y-3 rounded-xl bg-beige-100 p-3">
              <div>
                <Label htmlFor="gare">Gare (point de dépôt)</Label>
                <Input id="gare" name="gare" value={gare} onChange={(e) => onGareChange(e.target.value)} placeholder="Ex : Gare UTB Yamoussoukro" />
              </div>
              <div>
                <Label htmlFor="villeExpedition">Ville de destination</Label>
                <Input id="villeExpedition" name="villeExpedition" value={villeExpedition} onChange={(e) => onVilleExpeditionChange(e.target.value)} placeholder="Ex : Yamoussoukro" />
              </div>
              <div>
                <Label htmlFor="clientAdresseHorsAbidjan">Adresse détaillée</Label>
                <Input id="clientAdresseHorsAbidjan" name="clientAdresse" value={clientAdresse} onChange={(e) => onClientAdresseChange(e.target.value)} required />
              </div>
            </div>
          )}
        </div>

        {/* Prix de la livraison */}
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-900/50">Prix de la livraison</p>
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
              ? "Le tarif se met à jour automatiquement selon la commune choisie. Tu peux aussi l'ajuster manuellement."
              : `Suggestion hors Abidjan : ${formatFCFA(fourchetteFraisParDefaut(zone).min)} – ${formatFCFA(fourchetteFraisParDefaut(zone).max)}.`}
          </p>
        </div>
      </div>
    </Card>
  );
}
