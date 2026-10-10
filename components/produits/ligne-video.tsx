"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { allegerVideoEnLigne } from "@/lib/media/alleger-video";
import { enMo, tailleEnLigne } from "@/lib/media/compresser-video";

export const SEUIL_LOURDE = 8 * 1024 * 1024;

export interface VideoEnLigne {
  id: string;
  product_id: string;
  url: string;
}

/**
 * Une vidéo en ligne avec son poids et un bouton « Alléger » (compression
 * 720p dans le navigateur, puis remplacement). `declencheur` permet à un
 * bouton « Tout alléger » de lancer la compression de l'extérieur.
 */
export function LigneVideo({
  video, titre, onSupprimer, onAllegee, declencheur,
}: {
  video: VideoEnLigne;
  titre: string;
  onSupprimer?: () => void;
  onAllegee?: () => void;
  declencheur?: number;
}) {
  const [taille, setTaille] = useState<number | null>(null);
  const [etape, setEtape] = useState<string | null>(null);
  const [resultat, setResultat] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let actif = true;
    tailleEnLigne(video.url).then((t) => actif && setTaille(t));
    return () => { actif = false; };
  }, [video.url]);

  async function alleger() {
    if (etape) return;
    setErreur(null); setResultat(null);
    const r = await allegerVideoEnLigne(createClient(), video, setEtape);
    setEtape(null);
    if ("erreur" in r) { setErreur(r.erreur); return; }
    setResultat(`${enMo(r.avant)} → ${enMo(r.apres)}`);
    setTaille(r.apres);
    onAllegee?.();
  }

  useEffect(() => {
    if (declencheur && taille && taille > SEUIL_LOURDE && !resultat) alleger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [declencheur]);

  const lourde = taille !== null && taille > SEUIL_LOURDE;
  return (
    <div className="rounded-xl bg-beige-100 px-3 py-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <a href={video.url} target="_blank" rel="noreferrer" className="min-w-0 truncate text-terracotta-600 underline">
          {titre}
        </a>
        <div className="flex shrink-0 items-center gap-2">
          {taille !== null && (
            <span className={lourde ? "font-semibold text-red-600" : "text-ink-900/60"}>{enMo(taille)}</span>
          )}
          {lourde && !etape && <Button size="sm" onClick={alleger}>⚡ Alléger</Button>}
          {onSupprimer && !etape && <Button size="sm" variant="danger" onClick={onSupprimer}>Supprimer</Button>}
        </div>
      </div>
      {etape && <p className="mt-1 text-xs text-ink-900/60">{etape} (garde cette page ouverte)</p>}
      {resultat && <p className="mt-1 text-xs font-medium text-emerald-600">✓ Allégée : {resultat}</p>}
      {erreur && <p className="mt-1 text-xs text-red-600">{erreur}</p>}
    </div>
  );
}
