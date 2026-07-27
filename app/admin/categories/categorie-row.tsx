"use client";

import { useState, useTransition } from "react";
import { basculerCategorie, renommerCategorie, modifierIcone } from "./actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category } from "@/types/database";

export function CategorieRow({ category, nombreProduits }: { category: Category; nombreProduits: number }) {
  const [editing, setEditing] = useState(false);
  const [nom, setNom] = useState(category.nom);
  const [icone, setIcone] = useState(category.icone);
  const [pending, startTransition] = useTransition();

  return (
    <Card className="flex items-center justify-between gap-3">
      {editing ? (
        <div className="flex flex-1 items-center gap-2">
          <Input value={icone} onChange={(e) => setIcone(e.target.value)} className="w-16 text-center" maxLength={4} />
          <Input value={nom} onChange={(e) => setNom(e.target.value)} className="flex-1" />
        </div>
      ) : (
        <span className={`flex items-center gap-2 ${category.actif ? "" : "text-ink-900/40 line-through"}`}>
          <span className="text-xl">{category.icone}</span>
          {category.nom}
          <span className="rounded-full bg-beige-100 px-2 py-0.5 text-xs text-ink-900/50">{nombreProduits} produit(s)</span>
        </span>
      )}

      <div className="flex gap-2">
        {editing ? (
          <Button
            size="sm"
            disabled={pending}
            onClick={() => startTransition(() => {
              renommerCategorie(category.id, nom);
              modifierIcone(category.id, icone);
              setEditing(false);
            })}
          >
            Enregistrer
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Modifier</Button>
        )}
        <Button
          size="sm"
          variant={category.actif ? "danger" : "secondary"}
          disabled={pending}
          onClick={() => startTransition(() => { basculerCategorie(category.id, !category.actif); })}
        >
          {category.actif ? "Désactiver" : "Réactiver"}
        </Button>
      </div>
    </Card>
  );
}
