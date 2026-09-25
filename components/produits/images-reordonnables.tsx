"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Media, ProductVariant } from "@/types/database";

/**
 * Grille de photos réordonnable par glisser-déposer — fonctionne aussi
 * bien à la souris (ordinateur) qu'au doigt (téléphone), via les Pointer
 * Events du navigateur (une seule API pour les deux). On désactive la
 * capture implicite du pointeur au démarrage pour pouvoir détecter, à
 * chaque déplacement, au-dessus de quelle autre photo se trouve le doigt
 * ou le curseur (document.elementFromPoint).
 */
export function ImagesReordonnables({
  images,
  variants,
  labelVariante,
  onSupprimer,
  onReordonner,
}: {
  images: Media[];
  variants: ProductVariant[];
  labelVariante: (v: ProductVariant) => string;
  onSupprimer: (img: Media) => void;
  onReordonner: (nouvelOrdreIds: string[]) => void;
}) {
  const [ordreLocal, setOrdreLocal] = useState(images);
  const [idEnCours, setIdEnCours] = useState<string | null>(null);
  const conteneurRef = useRef<HTMLDivElement>(null);
  const aBougeRef = useRef(false);

  // Resynchronise si la liste change depuis l'extérieur (upload, suppression,
  // changement de filtre) — mais jamais pendant un glissement en cours.
  useEffect(() => {
    if (!idEnCours) setOrdreLocal(images);
  }, [images, idEnCours]);

  function demarrer(e: React.PointerEvent<HTMLDivElement>, id: string) {
    e.currentTarget.releasePointerCapture(e.pointerId);
    aBougeRef.current = false;
    setIdEnCours(id);
  }

  function surDeplacement(e: React.PointerEvent<HTMLDivElement>) {
    if (!idEnCours) return;
    aBougeRef.current = true;
    const cible = document.elementFromPoint(e.clientX, e.clientY);
    const carte = cible?.closest<HTMLElement>("[data-image-id]");
    const idCible = carte?.dataset.imageId;
    if (!idCible || idCible === idEnCours) return;

    setOrdreLocal((liste) => {
      const indexActuel = liste.findIndex((m) => m.id === idEnCours);
      const indexCible = liste.findIndex((m) => m.id === idCible);
      if (indexActuel === -1 || indexCible === -1) return liste;
      const copie = [...liste];
      const [deplace] = copie.splice(indexActuel, 1);
      copie.splice(indexCible, 0, deplace!);
      return copie;
    });
  }

  function terminer() {
    if (idEnCours && aBougeRef.current) {
      onReordonner(ordreLocal.map((m) => m.id));
    }
    setIdEnCours(null);
  }

  return (
    <div
      ref={conteneurRef}
      className="grid grid-cols-3 gap-2 sm:grid-cols-4"
      onPointerMove={surDeplacement}
      onPointerUp={terminer}
      onPointerCancel={terminer}
    >
      {ordreLocal.map((img) => {
        const variante = variants.find((v) => v.id === img.product_variant_id);
        const enCours = img.id === idEnCours;
        return (
          <div
            key={img.id}
            data-image-id={img.id}
            onPointerDown={(e) => demarrer(e, img.id)}
            style={{ touchAction: "none" }}
            className={`group relative aspect-square cursor-grab select-none overflow-hidden rounded-xl bg-beige-100 active:cursor-grabbing ${
              enCours ? "opacity-60 ring-2 ring-terracotta-500" : ""
            }`}
          >
            <Image src={img.url} alt="" fill sizes="(max-width: 640px) 33vw, 25vw" className="pointer-events-none object-cover" />
            {variante && (
              <span className="pointer-events-none absolute bottom-1 left-1 rounded-full bg-surface/90 px-2 py-0.5 text-[10px] font-medium">
                {labelVariante(variante)}
              </span>
            )}
            <button
              type="button"
              onClick={() => onSupprimer(img)}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute right-1 top-1 rounded-full bg-surface/90 px-2 py-0.5 text-xs opacity-0 transition group-hover:opacity-100"
            >
              Suppr.
            </button>
          </div>
        );
      })}
    </div>
  );
}
