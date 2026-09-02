"use client";

import Link from "next/link";
import { useActionState } from "react";
import { connecter } from "./actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";

export function FormulaireConnexion() {
  const [state, formAction, pending] = useActionState(connecter, undefined as { error?: string } | undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="identifiant">Téléphone ou email</Label>
        <Input id="identifiant" name="identifiant" required />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="motDePasse">Mot de passe</Label>
          <Link href="/mot-de-passe-oublie" className="text-xs text-terracotta-600 underline">
            Mot de passe oublié ?
          </Link>
        </div>
        <PasswordInput id="motDePasse" name="motDePasse" required />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Connexion..." : "Se connecter"}
      </Button>
    </form>
  );
}
