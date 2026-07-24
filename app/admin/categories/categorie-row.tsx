"use client";

import { useState, useTransition } from "react";
import { basculerCategorie, renommerCategorie } from "./actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category } from "@/types/database";

export function CategorieRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const [nom, setNom] = useState(category.nom);
  const [pending, startTransition] = useTransition();

  return (
    <Card className="flex items-center justify-between gap-3">
      {editing ? (
        <Input value={nom} onChange={(e) => setNom(e.target.value)} className="flex-1" />
      ) : (
        <span className={category.actif ? "" : "text-ink-900/40 line-through"}>{category.nom}</span>
      )}

      <div className="flex gap-2">
        {editing ? (
          <Button
            size="sm"
            disabled={pending}
            onClick={() => startTransition(() => { renommerCategorie(category.id, nom); setEditing(false); })}
          >
            Enregistrer
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Renommer</Button>
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
