"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export const CLE_THEME = "easydrop_theme";

export function ThemeToggle() {
  const [sombre, setSombre] = useState(false);

  // Synchronise l'état affiché du bouton avec la classe réellement posée
  // sur <html> (déjà appliquée avant l'hydratation par le script bloquant
  // dans app/layout.tsx, pour éviter un flash du mauvais thème).
  useEffect(() => {
    setSombre(document.documentElement.classList.contains("dark"));
  }, []);

  function basculer() {
    const nouveauSombre = !sombre;
    setSombre(nouveauSombre);
    document.documentElement.classList.toggle("dark", nouveauSombre);
    try {
      window.localStorage.setItem(CLE_THEME, nouveauSombre ? "sombre" : "clair");
    } catch {
      // Stockage indisponible : le thème choisi ne sera pas mémorisé d'une
      // session à l'autre, mais reste appliqué pour la session en cours.
    }
  }

  return (
    <button
      type="button"
      onClick={basculer}
      className="rounded-lg p-2 text-ink-900/70 transition hover:bg-beige-100 hover:text-ink-900"
      aria-label={sombre ? "Passer en mode clair" : "Passer en mode sombre"}
      title={sombre ? "Mode clair" : "Mode sombre"}
    >
      {sombre ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
