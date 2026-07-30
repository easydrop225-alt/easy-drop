"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { inscrireCommercial } from "./actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function FormulaireInscription() {
  const [state, formAction, pending] = useActionState(inscrireCommercial, undefined as { error?: string } | undefined);
  const searchParams = useSearchParams();
  const codeParraine = searchParams.get("ref") ?? "";

  return (
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
        <Label htmlFor="nomBoutique">Nom de ta boutique</Label>
        <Input id="nomBoutique" name="nomBoutique" placeholder="Ex : Chez Yannick Shop" required />
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
      <div>
        <Label htmlFor="codeParrainage">Code de parrainage (facultatif)</Label>
        <Input id="codeParrainage" name="codeParrainage" defaultValue={codeParraine} placeholder="Ex : JEA7901 (facultatif)" />
        <p className="mt-1 text-xs text-ink-900/50">
          Si quelqu'un t'a invité, indique son code ici. Cette information ne pourra plus être modifiée ensuite.
        </p>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Création en cours..." : "Créer mon compte"}
      </Button>
    </form>
  );
}

export default function InscriptionPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Devenir commercial</h1>
      <p className="mb-8 text-sm text-ink-900/60">
        Crée ton compte pour accéder immédiatement au catalogue et commencer à vendre.
      </p>
      <Suspense fallback={<p className="text-sm text-ink-900/40">Chargement...</p>}>
        <FormulaireInscription />
      </Suspense>
    </main>
  );
}
