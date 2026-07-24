"use client";

import { useState, useTransition } from "react";
import { modifierInfosCommandeAdmin } from "../actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Order, OrderItem } from "@/types/database";

export function InfosCommandeForm({
  order,
  item,
}: {
  order: Order;
  item: OrderItem;
}) {
  const [clientNom, setClientNom] = useState(order.client_nom);
  const [clientTelephone, setClientTelephone] = useState(order.client_telephone);
  const [clientCommune, setClientCommune] = useState(order.client_commune);
  const [clientAdresse, setClientAdresse] = useState(order.client_adresse);
  const [quantite, setQuantite] = useState(item.quantite);
  const [prixVenteUnitaire, setPrixVenteUnitaire] = useState(item.prix_vente_unitaire);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleValider() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await modifierInfosCommandeAdmin(order.id, {
        clientNom, clientTelephone, clientCommune, clientAdresse,
        itemId: item.id, quantite, prixVenteUnitaire,
      });
      if (res?.error) setError(res.error);
      else setSaved(true);
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label htmlFor="clientNom">Nom du client</Label><Input id="clientNom" value={clientNom} onChange={(e) => setClientNom(e.target.value)} /></div>
        <div><Label htmlFor="clientTelephone">Téléphone du client</Label><Input id="clientTelephone" value={clientTelephone} onChange={(e) => setClientTelephone(e.target.value)} /></div>
      </div>
      <div><Label htmlFor="clientCommune">Commune</Label><Input id="clientCommune" value={clientCommune} onChange={(e) => setClientCommune(e.target.value)} /></div>
      <div><Label htmlFor="clientAdresse">Adresse</Label><Input id="clientAdresse" value={clientAdresse} onChange={(e) => setClientAdresse(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label htmlFor="quantite">Quantité</Label><Input id="quantite" type="number" min={1} value={quantite} onChange={(e) => setQuantite(Number(e.target.value))} /></div>
        <div><Label htmlFor="prixVenteUnitaire">Prix de vente unitaire</Label><Input id="prixVenteUnitaire" type="number" min={0} value={prixVenteUnitaire} onChange={(e) => setPrixVenteUnitaire(Number(e.target.value))} /></div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button size="sm" disabled={pending} onClick={handleValider}>
        {pending ? "Enregistrement..." : "Enregistrer les modifications"}
      </Button>
      {saved && <span className="ml-2 text-sm text-emerald-600">Enregistré ✓</span>}
    </div>
  );
}
