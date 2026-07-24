"use client";

import { useActionState } from "react";
import { sauvegarderParametres } from "./actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ParametresForm({
  fraisAbidjan,
  fraisHorsAbidjan,
  whatsapp,
  horaires,
}: {
  fraisAbidjan?: { min: number; max: number };
  fraisHorsAbidjan?: { min: number; max: number };
  whatsapp?: string;
  horaires?: string;
}) {
  const [state, formAction, pending] = useActionState(sauvegarderParametres, undefined as { error?: string } | undefined);

  return (
    <form action={formAction} className="space-y-4">
      <Card className="space-y-3">
        <h2 className="font-medium">Frais de livraison — Abidjan</h2>
        <div className="grid grid-cols-2 gap-3">
          <div><Label htmlFor="fraisAbidjanMin">Minimum</Label><Input id="fraisAbidjanMin" name="fraisAbidjanMin" type="number" defaultValue={fraisAbidjan?.min ?? 1500} /></div>
          <div><Label htmlFor="fraisAbidjanMax">Maximum</Label><Input id="fraisAbidjanMax" name="fraisAbidjanMax" type="number" defaultValue={fraisAbidjan?.max ?? 2000} /></div>
        </div>
      </Card>
      <Card className="space-y-3">
        <h2 className="font-medium">Frais de livraison — Hors Abidjan</h2>
        <div className="grid grid-cols-2 gap-3">
          <div><Label htmlFor="fraisHorsAbidjanMin">Minimum</Label><Input id="fraisHorsAbidjanMin" name="fraisHorsAbidjanMin" type="number" defaultValue={fraisHorsAbidjan?.min ?? 2500} /></div>
          <div><Label htmlFor="fraisHorsAbidjanMax">Maximum</Label><Input id="fraisHorsAbidjanMax" name="fraisHorsAbidjanMax" type="number" defaultValue={fraisHorsAbidjan?.max ?? 4000} /></div>
        </div>
      </Card>
      <Card className="space-y-3">
        <h2 className="font-medium">Coordonnées</h2>
        <div><Label htmlFor="whatsapp">Numéro WhatsApp</Label><Input id="whatsapp" name="whatsapp" defaultValue={whatsapp ?? ""} /></div>
        <div><Label htmlFor="horaires">Horaires</Label><Input id="horaires" name="horaires" defaultValue={horaires ?? ""} /></div>
      </Card>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Enregistrement..." : "Enregistrer les paramètres"}</Button>
    </form>
  );
}
