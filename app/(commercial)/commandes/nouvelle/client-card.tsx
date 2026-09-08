"use client";

import { useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";
import { fourchetteFraisParDefaut } from "@/lib/calculs/calcul-livraison";
import { COMMUNES_ABIDJAN } from "@/lib/data/communes-abidjan";
import type { ZoneLivraison } from "@/types/database";

/**
 * Affichage pur des informations client + livraison, regroupées dans une
 * seule section (le lieu de livraison dépend directement de la zone
 * choisie juste au-dessus, donc les deux vont ensemble) : la mise à jour
 * automatique du tarif de livraison selon la commune reste gérée par le
 * formulaire parent (onCommuneChange).
 */
export function ClientCard({
  clientNom,
  onClientNomChange,
  clientTelephone,
  onClientTelephoneChange,
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
  clientNom: string;
  onClientNomChange: (v: string) => void;
  clientTelephone: string;
  onClientTelephoneChange: (v: string) => void;
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
      <h2 className="mb-4 font-medium">Client & Livraison</h2>
      <div className="space-y-3">
        <div>
          <Label htmlFor="clientNom">Nom du client</Label>
          <Input id="clientNom" name="clientNom" value={clientNom} onChange={(e) => onClientNomChange(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="clientTelephone">Téléphone du client</Label>
          <Input id="clientTelephone" name="clientTelephone" value={clientTelephone} onChange={(e) => onClientTelephoneChange(e.target.value)} required />
        </div>

        <div>
          <Label>Zone</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label
              className={`flex cursor-pointer items-start gap-2 rounded-xl border-2 p-3 text-sm transition ${
                zone === "abidjan" ? "border-terracotta-500 bg-terracotta-50" : "border-ink-900/10"
              }`}
            >
              <input
                type="radio"
                name="zone"
                value="abidjan"
                checked={zone === "abidjan"}
                onChange={() => onZoneChange("abidjan")}
                className="mt-0.5"
              />
              <span>
                <span className="block font-medium">Abidjan</span>
                <span className="block text-xs text-ink-900/50">Paiement à la livraison</span>
              </span>
            </label>
            <label
              className={`flex cursor-pointer items-start gap-2 rounded-xl border-2 p-3 text-sm transition ${
                zone === "hors_abidjan" ? "border-terracotta-500 bg-terracotta-50" : "border-ink-900/10"
              }`}
            >
              <input
                type="radio"
                name="zone"
                value="hors_abidjan"
                checked={zone === "hors_abidjan"}
                onChange={() => onZoneChange("hors_abidjan")}
                className="mt-0.5"
              />
              <span>
                <span className="block font-medium">Expédition</span>
                <span className="block text-xs text-ink-900/50">Paiement avant expédition</span>
              </span>
            </label>
          </div>
        </div>

        <div>
          <Label>Lieu de livraison</Label>
          {zone === "abidjan" ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Label htmlFor="clientCommune">Commune</Label>
                <Input
                  id="clientCommune"
                  name="clientCommune"
                  value={commune}
                  onChange={(e) => { onCommuneChange(e.target.value); setListeOuverte(true); }}
                  onFocus={() => setListeOuverte(true)}
                  onBlur={() => setTimeout(() => setListeOuverte(false), 150)}
                  placeholder="Commence à écrire..."
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
                <Label htmlFor="clientAdresse">Quartier</Label>
                <Input id="clientAdresse" name="clientAdresse" value={clientAdresse} onChange={(e) => onClientAdresseChange(e.target.value)} required />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="villeExpedition">Ville</Label>
                <Input id="villeExpedition" name="villeExpedition" value={villeExpedition} onChange={(e) => onVilleExpeditionChange(e.target.value)} placeholder="Ex : Yamoussoukro" required />
              </div>
              <div>
                <Label htmlFor="gare">Gare</Label>
                <Input id="gare" name="gare" value={gare} onChange={(e) => onGareChange(e.target.value)} placeholder="Ex : Gare UTB" required />
              </div>
            </div>
          )}
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
      </div>
    </Card>
  );
}
