"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { rechercheGlobale, type ResultatRecherche } from "@/app/admin/recherche/actions";

const ICONES = { commande: "📦", produit: "🛍️", commercial: "👤" };

export function RechercheGlobale() {
  const [ouvert, setOuvert] = useState(false);
  const [requete, setRequete] = useState("");
  const [resultats, setResultats] = useState<ResultatRecherche[]>([]);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOuvert(true);
      }
      if (e.key === "Escape") setOuvert(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (requete.trim().length < 2) {
      setResultats([]);
      return;
    }
    const t = setTimeout(() => {
      startTransition(async () => {
        const r = await rechercheGlobale(requete);
        setResultats(r);
      });
    }, 250);
    return () => clearTimeout(t);
  }, [requete]);

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="hidden items-center gap-2 rounded-lg border border-ink-900/10 px-3 py-1.5 text-sm text-ink-900/50 hover:bg-beige-100 lg:flex"
      >
        <Search size={15} /> Rechercher <span className="ml-2 rounded bg-beige-100 px-1.5 py-0.5 text-xs">Ctrl K</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink-900/50 p-4 pt-24" onClick={() => setOuvert(false)}>
      <div className="w-full max-w-lg rounded-2xl bg-surface shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-ink-900/5 p-3">
          <Search size={18} className="text-ink-900/40" />
          <input
            autoFocus
            value={requete}
            onChange={(e) => setRequete(e.target.value)}
            placeholder="Rechercher une commande, un produit, un commercial..."
            className="flex-1 border-none text-sm outline-none"
          />
          <button onClick={() => setOuvert(false)} aria-label="Fermer la recherche"><X size={18} className="text-ink-900/40" /></button>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {pending && <p className="p-3 text-sm text-ink-900/40">Recherche...</p>}
          {!pending && requete.trim().length >= 2 && resultats.length === 0 && (
            <p className="p-3 text-sm text-ink-900/40">Aucun résultat.</p>
          )}
          {resultats.map((r, i) => (
            <button
              key={i}
              onClick={() => { setOuvert(false); setRequete(""); router.push(r.lien); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-beige-100"
            >
              <span className="text-lg">{ICONES[r.type]}</span>
              <div>
                <p className="text-sm font-medium">{r.titre}</p>
                <p className="text-xs text-ink-900/50">{r.sousTitre}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
