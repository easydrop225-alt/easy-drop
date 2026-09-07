"use client";

import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

/**
 * Informations d'identification du client — le lieu de livraison (commune,
 * adresse) est désormais dans LieuLivraisonCard, à côté du prix de la
 * livraison.
 */
export function ClientCard({
  clientNom,
  onClientNomChange,
  clientTelephone,
  onClientTelephoneChange,
}: {
  clientNom: string;
  onClientNomChange: (v: string) => void;
  clientTelephone: string;
  onClientTelephoneChange: (v: string) => void;
}) {
  return (
    <Card>
      <h2 className="mb-4 font-medium">Informations du client</h2>
      <div className="space-y-3">
        <div>
          <Label htmlFor="clientNom">Nom du client</Label>
          <Input id="clientNom" name="clientNom" value={clientNom} onChange={(e) => onClientNomChange(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="clientTelephone">Téléphone du client</Label>
          <Input id="clientTelephone" name="clientTelephone" value={clientTelephone} onChange={(e) => onClientTelephoneChange(e.target.value)} required />
        </div>
      </div>
    </Card>
  );
}
