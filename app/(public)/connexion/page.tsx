"use client";

import { useActionState } from "react";
import { connecter } from "./actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";

export default function ConnexionPage() {
  const [state, formAction, pending] = useActionState(connecter, undefined as { error?: string } | undefined);

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-8 text-2xl font-semibold">Connexion</h1>
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="identifiant">Téléphone ou email</Label>
          <Input id="identifiant" name="identifiant" required />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="motDePasse">Mot de passe</Label>
            <a href="/mot-de-passe-oublie" className="text-xs text-terracotta-600 underline">
              Mot de passe oublié ?
            </a>
          </div>
          <PasswordInput id="motDePasse" name="motDePasse" required />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Connexion..." : "Se connecter"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-ink-900/60">
        Pas encore de compte ? <a href="/inscription" className="text-terracotta-600 underline">S'inscrire</a>
      </p>
    </main>
  );
}
