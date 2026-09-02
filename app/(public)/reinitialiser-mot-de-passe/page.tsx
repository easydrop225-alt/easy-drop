"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { definirNouveauMotDePasse } from "./actions";
import { Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput, ExigencesMotDePasse } from "@/components/ui/password-input";

export default function ReinitialiserMotDePassePage() {
  const [motDePasse, setMotDePasse] = useState("");
  const [state, formAction, pending] = useActionState(
    definirNouveauMotDePasse,
    undefined as { error?: string; succes?: boolean } | undefined
  );

  if (state?.succes) {
    return (
      <main className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="mb-3 text-2xl font-semibold">Mot de passe mis à jour ✅</h1>
        <p className="mb-6 text-sm text-ink-900/60">Tu peux maintenant te connecter avec ton nouveau mot de passe.</p>
        <Link href="/connexion">
          <Button className="w-full">Se connecter</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-8 text-2xl font-semibold">Choisir un nouveau mot de passe</h1>
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="motDePasse">Nouveau mot de passe</Label>
          <PasswordInput
            id="motDePasse"
            name="motDePasse"
            required
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
          />
          <ExigencesMotDePasse valeur={motDePasse} />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Enregistrement..." : "Enregistrer le nouveau mot de passe"}
        </Button>
      </form>
    </main>
  );
}
