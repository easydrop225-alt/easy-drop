"use client";

import { useState, useTransition } from "react";
import { validerProduitFournisseur, refuserProduitFournisseur } from "./actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatFCFA } from "@/lib/utils";
import type { Product } from "@/types/database";

export function ValidationFournisseurCard({ produits }: { produits: Product[] }) {
  const [pending, startTransition] = useTransition();
  const [motifOuvertPour, setMotifOuvertPour] = useState<string | null>(null);
  const [motif, setMotif] = useState("");

  if (produits.length === 0) return null;

  return (
    <Card className="mb-6 border-amber-300 bg-amber-50">
      <h2 className="mb-3 font-medium">⏳ Produits fournisseurs en attente de validation ({produits.length})</h2>
      <div className="space-y-2">
        {produits.map((p) => (
          <div key={p.id} className="rounded-xl bg-surface p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{p.nom}</p>
                <p className="text-xs text-ink-900/50">
                  Prix fournisseur brut : {formatFCFA(p.prix_fournisseur_externe_brut ?? 0)} → prix affiché : {formatFCFA(p.prix_fournisseur)} (+10%)
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" disabled={pending} onClick={() => startTransition(() => { validerProduitFournisseur(p.id); })}>
                  Valider
                </Button>
                <Button size="sm" variant="danger" disabled={pending} onClick={() => setMotifOuvertPour(motifOuvertPour === p.id ? null : p.id)}>
                  Refuser
                </Button>
              </div>
            </div>
            {motifOuvertPour === p.id && (
              <div className="mt-2 flex gap-2">
                <input
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder="Motif du refus (optionnel)"
                  className="h-9 flex-1 rounded-lg border border-ink-900/10 px-2 text-sm"
                />
                <Button
                  size="sm"
                  variant="danger"
                  disabled={pending}
                  onClick={() => startTransition(async () => {
                    await refuserProduitFournisseur(p.id, motif);
                    setMotifOuvertPour(null);
                    setMotif("");
                  })}
                >
                  Confirmer le refus
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
