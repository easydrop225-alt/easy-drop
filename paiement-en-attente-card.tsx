"use client";

import { useState, useTransition } from "react";
import { mettreAJourParametre } from "./actions";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/database";

export function AccueilCommercialForm({
  texteActuel,
  modeActuel,
  produitsVedetteActuels,
  produits,
}: {
  texteActuel: string;
  modeActuel: "statique" | "aleatoire";
  produitsVedetteActuels: string[];
  produits: Product[];
}) {
  const [texte, setTexte] = useState(texteActuel);
  const [mode, setMode] = useState<"statique" | "aleatoire">(modeActuel);
  const [selection, setSelection] = useState<string[]>(produitsVedetteActuels);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggleProduit(id: string) {
    setSelection((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function enregistrer() {
    setSaved(false);
    startTransition(async () => {
      await mettreAJourParametre("accueil_texte", texte);
      await mettreAJourParametre("produits_vedette_mode", mode);
      await mettreAJourParametre("produits_vedette_ids", selection);
      setSaved(true);
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Texte d'accroche (haut du dashboard commercial)</label>
        <textarea
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-ink-900/10 p-3 text-sm"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Produits mis en avant sur le dashboard commercial</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("aleatoire")}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm ${mode === "aleatoire" ? "border-terracotta-500 bg-terracotta-50 font-medium" : "border-ink-900/10"}`}
          >
            🎲 Aléatoire (change à chaque visite)
          </button>
          <button
            type="button"
            onClick={() => setMode("statique")}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm ${mode === "statique" ? "border-terracotta-500 bg-terracotta-50 font-medium" : "border-ink-900/10"}`}
          >
            📌 Statique (je choisis)
          </button>
        </div>
      </div>

      {mode === "statique" && (
        <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-ink-900/10 p-2">
          {produits.map((p) => (
            <label key={p.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-beige-100">
              <input type="checkbox" checked={selection.includes(p.id)} onChange={() => toggleProduit(p.id)} />
              {p.nom}
            </label>
          ))}
          {produits.length === 0 && <p className="p-2 text-sm text-ink-900/40">Aucun produit actif.</p>}
        </div>
      )}

      <Button size="sm" disabled={pending} onClick={enregistrer}>
        {pending ? "Enregistrement..." : "Enregistrer"}
      </Button>
      {saved && <span className="ml-2 text-sm text-emerald-600">Enregistré ✓</span>}
    </div>
  );
}
