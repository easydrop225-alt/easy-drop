"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

/**
 * Description d'un produit, visible par le commercial, avec un bouton pour la
 * copier d'un geste (pour ses publicités : statut WhatsApp, Facebook, TikTok…).
 */
export function DescriptionCopiable({ texte }: { texte: string }) {
  const [copie, setCopie] = useState(false);

  async function copier() {
    try {
      await navigator.clipboard.writeText(texte);
    } catch {
      // ancien navigateur : sélection + copie classique
      const zone = document.createElement("textarea");
      zone.value = texte;
      document.body.appendChild(zone);
      zone.select();
      document.execCommand("copy");
      zone.remove();
    }
    setCopie(true);
    setTimeout(() => setCopie(false), 2500);
  }

  return (
    <Card className="mb-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="font-medium">Description du produit</h2>
        <button
          type="button"
          onClick={copier}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
            copie ? "bg-emerald-600 text-white" : "bg-terracotta-500 text-white hover:bg-terracotta-600"
          }`}
        >
          {copie ? "✓ Copiée" : "📋 Copier"}
        </button>
      </div>
      <p className="select-text whitespace-pre-line text-sm leading-relaxed text-ink-900/80">{texte}</p>
      <p className="mt-2 text-xs text-ink-900/40">Copie-la pour tes publicités (WhatsApp, Facebook, TikTok…).</p>
    </Card>
  );
}
