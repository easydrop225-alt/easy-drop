"use client";

import { useState, useTransition } from "react";
import { modifierNomBoutique } from "./actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const TRENTE_JOURS_MS = 30 * 24 * 60 * 60 * 1000;

export function BoutiqueForm({
  nomActuel,
  derniereModification,
}: {
  nomActuel: string | null;
  derniereModification: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [nom, setNom] = useState(nomActuel ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const peutModifier =
    !derniereModification || Date.now() - new Date(derniereModification).getTime() >= TRENTE_JOURS_MS;

  const prochaineDateDisponible = derniereModification
    ? new Date(new Date(derniereModification).getTime() + TRENTE_JOURS_MS).toLocaleDateString("fr-FR")
    : null;

  if (!editing) {
    return (
      <div className="flex items-center justify-between">
        <p><span className="text-ink-900/50">Boutique : </span>{nomActuel || "—"}</p>
        {peutModifier ? (
          <button onClick={() => setEditing(true)} className="text-xs text-terracotta-600 underline">
            Modifier
          </button>
        ) : (
          <span className="text-xs text-ink-900/40">Modifiable le {prochaineDateDisponible}</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="nomBoutique">Nom de la boutique</Label>
      <Input id="nomBoutique" value={nom} onChange={(e) => setNom(e.target.value)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-600">Nom de boutique mis à jour ✓</p>}
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const res = await modifierNomBoutique(nom);
              if (res?.error) setError(res.error);
              else { setSaved(true); setEditing(false); }
            })
          }
        >
          {pending ? "Enregistrement..." : "Enregistrer"}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => { setEditing(false); setNom(nomActuel ?? ""); }}>
          Annuler
        </Button>
      </div>
      <p className="text-xs text-ink-900/40">Un seul changement autorisé par mois.</p>
    </div>
  );
}
