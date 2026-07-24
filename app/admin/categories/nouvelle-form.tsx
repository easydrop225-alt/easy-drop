"use client";

import { useActionState } from "react";
import { creerCategorie } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function NouvelleCategorieForm() {
  const [state, formAction, pending] = useActionState(creerCategorie, undefined as { error?: string } | undefined);

  return (
    <Card>
      <form action={formAction} className="flex gap-3">
        <Input name="nom" placeholder="Nom de la nouvelle catégorie (ex : Sacs à main)" required className="flex-1" />
        <Button type="submit" disabled={pending}>{pending ? "Ajout..." : "Ajouter"}</Button>
      </form>
      {state?.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
    </Card>
  );
}
