"use client";

import { useActionState, useState } from "react";
import { inscrireCommercial } from "./actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput, ExigencesMotDePasse, criteresManquants } from "@/components/ui/password-input";

export function FormulaireInscription() {
  const [state, formAction, pending] = useActionState(inscrireCommercial, undefined as { error?: string } | undefined);
  const [motDePasse, setMotDePasse] = useState("");
  const manquants = criteresManquants(motDePasse);
  const motDePasseOk = manquants.length === 0;

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="prenom">Prénom</Label>
          <Input id="prenom" name="prenom" required />
        </div>
        <div>
          <Label htmlFor="nom">Nom</Label>
          <Input id="nom" name="nom" required />
        </div>
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
      {motDePasse.length > 0 && !motDePasseOk && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          Mot de passe incomplet — il manque : <strong>{manquants.join(", ")}</strong>.
        </p>
      )}
      {state?.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{state.error}</p>
      )}
      <Button type="submit" disabled={pending || !motDePasseOk} className="w-full">
        {pending ? "Création en cours..." : motDePasseOk ? "Créer mon compte" : "Complète le mot de passe"}
      </Button>
    </form>
  );
}
