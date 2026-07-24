"use client";

import { useActionState } from "react";
import { inscrireCommercial } from "./actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function InscriptionPage() {
  const [state, formAction, pending] = useActionState(inscrireCommercial, undefined as { error?: string } | undefined);

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Devenir commercial</h1>
      <p className="mb-8 text-sm text-ink-900/60">
        Ton compte sera activé après validation par l'administration.
      </p>
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="prenom">Prénom</Label>
          <Input id="prenom" name="prenom" required />
        </div>
        <div>
          <Label htmlFor="nom">Nom</Label>
          <Input id="nom" name="nom" required />
        </div>
        <div>
          <Label htmlFor="telephone">Téléphone (format +225XXXXXXXXXX)</Label>
          <Input id="telephone" name="telephone" placeholder="+2250700000000" required />
        </div>
        <div>
          <Label htmlFor="email">Email (facultatif)</Label>
          <Input id="email" name="email" type="email" />
        </div>
        <div>
          <Label htmlFor="motDePasse">Mot de passe</Label>
          <Input id="motDePasse" name="motDePasse" type="password" required minLength={8} />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Création en cours..." : "Créer mon compte"}
        </Button>
      </form>
    </main>
  );
}
