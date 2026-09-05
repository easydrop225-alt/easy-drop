"use client";

import { useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { COMMUNES_ABIDJAN } from "@/lib/data/communes-abidjan";

/**
 * Affichage pur des informations client — la mise à jour automatique du
 * tarif de livraison selon la commune reste gérée par le formulaire parent
 * (onCommuneChange).
 */
export function ClientCard({
  clientNom,
  onClientNomChange,
  clientTelephone,
  onClientTelephoneChange,
  commune,
  onCommuneChange,
  clientAdresse,
  onClientAdresseChange,
}: {
  clientNom: string;
  onClientNomChange: (v: string) => void;
  clientTelephone: string;
  onClientTelephoneChange: (v: string) => void;
  commune: string;
  onCommuneChange: (v: string) => void;
  clientAdresse: string;
  onClientAdresseChange: (v: string) => void;
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
      <h2 className="mb-4 font-medium">Client</h2>
      <div className="space-y-3">
        <div>
          <Label htmlFor="clientNom">Nom du client</Label>
          <Input id="clientNom" name="clientNom" value={clientNom} onChange={(e) => onClientNomChange(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="clientTelephone">Téléphone du client</Label>
          <Input id="clientTelephone" name="clientTelephone" value={clientTelephone} onChange={(e) => onClientTelephoneChange(e.target.value)} required />
        </div>
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
          <Label htmlFor="clientAdresse">Adresse complète</Label>
          <Input id="clientAdresse" name="clientAdresse" value={clientAdresse} onChange={(e) => onClientAdresseChange(e.target.value)} required />
        </div>
      </div>
    </Card>
  );
}
