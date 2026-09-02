"use client";

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
        <div>
          <Label htmlFor="clientCommune">Commune</Label>
          <Input
            id="clientCommune"
            name="clientCommune"
            list="communes-liste"
            value={commune}
            onChange={(e) => onCommuneChange(e.target.value)}
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
        <div>
          <Label htmlFor="clientAdresse">Adresse complète</Label>
          <Input id="clientAdresse" name="clientAdresse" value={clientAdresse} onChange={(e) => onClientAdresseChange(e.target.value)} required />
        </div>
      </div>
    </Card>
  );
}
