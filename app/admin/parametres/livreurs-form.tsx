"use client";

import { useState, useTransition } from "react";
import { ajouterLivreur, retirerLivreur } from "../livreurs-actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { Livreur } from "@/types/database";

export function LivreursForm({ livreurs }: { livreurs: Livreur[] }) {
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAjouter() {
    setError(null);
    startTransition(async () => {
      const res = await ajouterLivreur(nom, telephone);
      if (res?.error) setError(res.error);
      else { setNom(""); setTelephone(""); }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-900/50">
        Cette liste sert uniquement à assigner un livreur à une commande dans Admin &gt; Commandes — jamais visible côté commercial.
      </p>

      {livreurs.length > 0 && (
        <div className="space-y-2">
          {livreurs.map((l) => (
            <div key={l.id} className="flex items-center justify-between rounded-xl bg-beige-100 px-3 py-2 text-sm">
              <span>🛵 {l.nom}{l.telephone && <span className="text-ink-900/50"> — {l.telephone}</span>}</span>
              <button
                type="button"
                onClick={() => startTransition(() => { retirerLivreur(l.id); })}
                className="text-xs text-red-600 underline"
              >
                Retirer
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 rounded-xl border border-ink-900/10 p-3">
        <Label htmlFor="nomLivreur">Nom du livreur</Label>
        <Input id="nomLivreur" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : Yao" />
        <Label htmlFor="telephoneLivreur">Téléphone (optionnel)</Label>
        <Input id="telephoneLivreur" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Ex : 07 00 00 00 00" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="button" size="sm" disabled={pending || !nom.trim()} onClick={handleAjouter}>
          {pending ? "Ajout..." : "Ajouter ce livreur"}
        </Button>
      </div>
    </div>
  );
}
