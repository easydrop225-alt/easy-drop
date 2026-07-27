"use client";

import { useState, useTransition } from "react";
import { modifierTelephone } from "./actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const TRENTE_JOURS_MS = 30 * 24 * 60 * 60 * 1000;

export function TelephoneForm({
  telephoneActuel,
  derniereModification,
}: {
  telephoneActuel: string;
  derniereModification: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [telephone, setTelephone] = useState(telephoneActuel);
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
        <p><span className="text-ink-900/50">Téléphone : </span>{telephoneActuel}</p>
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
      <Label htmlFor="telephone">Nouveau téléphone</Label>
      <Input id="telephone" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+2250700000000" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-600">Téléphone mis à jour ✓</p>}
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const res = await modifierTelephone(telephone);
              if (res?.error) setError(res.error);
              else { setSaved(true); setEditing(false); }
            })
          }
        >
          {pending ? "Enregistrement..." : "Enregistrer"}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => { setEditing(false); setTelephone(telephoneActuel); }}>
          Annuler
        </Button>
      </div>
      <p className="text-xs text-ink-900/40">Un seul changement autorisé par mois.</p>
    </div>
  );
}
