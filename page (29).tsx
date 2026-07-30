"use client";

import { useActionState } from "react";
import { creerFormation } from "./actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function NouvelleFormationForm() {
  const [state, formAction, pending] = useActionState(creerFormation, undefined as { error?: string } | undefined);

  return (
    <Card className="space-y-3">
      <h2 className="font-medium">Ajouter une vidéo de formation</h2>
      <form action={formAction} className="space-y-3">
        <div>
          <Label htmlFor="titre">Titre</Label>
          <Input id="titre" name="titre" placeholder="Ex : Comment créer une commande" required />
        </div>
        <div>
          <Label htmlFor="videoUrl">Lien de la vidéo (YouTube ou Vimeo)</Label>
          <Input id="videoUrl" name="videoUrl" placeholder="https://www.youtube.com/watch?v=..." required />
        </div>
        <div>
          <Label htmlFor="description">Description (facultatif)</Label>
          <textarea id="description" name="description" rows={2} className="w-full rounded-xl border border-ink-900/10 p-3 text-sm" />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <Button size="sm" disabled={pending}>{pending ? "Ajout..." : "Ajouter"}</Button>
      </form>
    </Card>
  );
}
