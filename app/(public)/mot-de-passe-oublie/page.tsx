"use client";

import { useActionState } from "react";
import { demanderReinitialisation } from "./actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function MotDePasseOubliePage() {
  const [state, formAction, pending] = useActionState(
    demanderReinitialisation,
    undefined as { error?: string; succes?: boolean } | undefined
  );

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Mot de passe oublié</h1>
      <p className="mb-8 text-sm text-ink-900/60">
        Indique l&apos;adresse email associée à ton compte : un lien pour choisir un nouveau mot de passe te sera envoyé.
      </p>

      {state?.succes ? (
        <Card className="bg-beige-100">
          <p className="text-sm">
            Si cette adresse correspond à un compte Easy Drop, un email vient de t&apos;être envoyé avec un lien pour réinitialiser ton mot de passe.
            Pense à vérifier tes courriers indésirables (spam) si tu ne le vois pas d&apos;ici quelques minutes.
          </p>
        </Card>
      ) : (
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="email">Adresse email</Label>
            <Input id="email" name="email" type="email" required placeholder="toi@exemple.com" />
          </div>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Envoi..." : "Envoyer le lien de réinitialisation"}
          </Button>
        </form>
      )}

      <div className="mt-6 space-y-1 text-sm">
        <p>
          <a href="/connexion" className="text-terracotta-600 underline">Retour à la connexion</a>
        </p>
        <p className="text-ink-900/50">
          Pas d&apos;adresse email enregistrée sur ton compte ? Contacte l&apos;administrateur Easy Drop directement (bouton WhatsApp dans l&apos;app) pour qu&apos;il réinitialise ton mot de passe.
        </p>
      </div>
    </main>
  );
}
