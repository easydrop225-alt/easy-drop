"use client";

import { useActionState } from "react";
import { enregistrerPaiement } from "./actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Profile } from "@/types/database";

export function PaiementForm({ commerciaux }: { commerciaux: Profile[] }) {
  const [state, formAction, pending] = useActionState(enregistrerPaiement, undefined as { error?: string } | undefined);

  return (
    <Card>
      <h2 className="mb-4 font-medium">Enregistrer un paiement</h2>
      <form action={formAction} className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="col-span-2">
          <Label htmlFor="commercialId">Commercial</Label>
          <select id="commercialId" name="commercialId" className="h-10 w-full rounded-xl border border-ink-900/10 bg-white px-3 text-sm">
            {commerciaux.map((c) => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
          </select>
        </div>
        <div><Label htmlFor="montant">Montant</Label><Input id="montant" name="montant" type="number" required /></div>
        <div>
          <Label htmlFor="mode">Mode</Label>
          <select id="mode" name="mode" className="h-10 w-full rounded-xl border border-ink-900/10 bg-white px-3 text-sm">
            <option value="wave">Wave</option>
            <option value="orange_money">Orange Money</option>
            <option value="especes">Espèces</option>
          </select>
        </div>
        <div className="col-span-2 md:col-span-4"><Label htmlFor="referencePaiement">Référence (facultatif)</Label><Input id="referencePaiement" name="referencePaiement" /></div>
        {state?.error && <p className="col-span-full text-sm text-red-600">{state.error}</p>}
        <Button type="submit" disabled={pending} className="col-span-full md:col-span-1">
          {pending ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </form>
    </Card>
  );
}
