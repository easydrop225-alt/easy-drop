"use client";

import { useState, useTransition } from "react";
import { modifierFormation, basculerActifFormation, supprimerFormation } from "./actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Formation } from "@/types/database";

export function FormationRow({ formation }: { formation: Formation }) {
  const [edition, setEdition] = useState(false);
  const [titre, setTitre] = useState(formation.titre);
  const [description, setDescription] = useState(formation.description ?? "");
  const [videoUrl, setVideoUrl] = useState(formation.video_url);
  const [pending, startTransition] = useTransition();

  if (edition) {
    return (
      <Card className="space-y-2">
        <Input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Titre" />
        <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Lien vidéo" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-xl border border-ink-900/10 p-2 text-sm" />
        <div className="flex gap-2">
          <Button size="sm" disabled={pending} onClick={() => startTransition(async () => { await modifierFormation(formation.id, { titre, description, videoUrl }); setEdition(false); })}>
            Enregistrer
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setEdition(false)}>Annuler</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex items-center justify-between gap-3">
      <div>
        <p className="font-medium">{formation.titre}</p>
        {formation.description && <p className="text-xs text-ink-900/50">{formation.description}</p>}
        <a href={formation.video_url} target="_blank" rel="noreferrer" className="text-xs text-terracotta-600 underline">Voir le lien</a>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-ink-900/50">
          <input
            type="checkbox"
            checked={formation.actif}
            disabled={pending}
            onChange={(e) => { const val = e.target.checked; startTransition(() => { basculerActifFormation(formation.id, val); }); }}
          />
          Visible
        </label>
        <Button size="sm" variant="secondary" onClick={() => setEdition(true)}>Modifier</Button>
        <Button
          size="sm"
          variant="danger"
          disabled={pending}
          onClick={() => { if (confirm("Supprimer cette vidéo de formation ?")) startTransition(() => { supprimerFormation(formation.id); }); }}
        >
          Supprimer
        </Button>
      </div>
    </Card>
  );
}
