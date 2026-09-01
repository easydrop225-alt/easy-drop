"use client";

import Image from "next/image";
import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { inscrireCommercial } from "./actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput, ExigencesMotDePasse } from "@/components/ui/password-input";

function FormulaireInscription() {
  const [state, formAction, pending] = useActionState(inscrireCommercial, undefined as { error?: string } | undefined);
  const searchParams = useSearchParams();
  const codeParraine = searchParams.get("ref") ?? "";
  const [motDePasse, setMotDePasse] = useState("");

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
        <p className="mt-1 text-xs text-ink-900/50">
          Recommandé : c&apos;est ce qui permet de récupérer ton compte si tu oublies ton mot de passe.
        </p>
      </div>
      <div>
        <Label htmlFor="motDePasse">Mot de passe</Label>
        <PasswordInput
          id="motDePasse"
          name="motDePasse"
          required
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
        />
        <ExigencesMotDePasse valeur={motDePasse} />
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
      <div className="mb-8 flex flex-col items-center text-center">
        <Image src="/logo-easy-drop.png" alt="Easy Drop" width={64} height={64} className="mb-4 h-16 w-16 rounded-2xl object-contain" />
        <h1 className="text-2xl font-semibold">S&apos;inscrire sur Easy Drop</h1>
        <p className="mt-2 text-sm text-ink-900/60">
          Crée ton compte pour accéder immédiatement au catalogue et commencer à vendre — sans stock, sans avance de frais.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-ink-900/40">Chargement...</p>}>
        <FormulaireInscription />
      </Suspense>
      <p className="mt-6 text-center text-sm text-ink-900/60">
        Déjà un compte ? <a href="/connexion" className="font-medium text-terracotta-600 underline">Se connecter</a>
      </p>
    </main>
  );
}
