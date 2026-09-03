"use client";

import { useEffect, useRef, useState } from "react";

// 1mm = 96/25.4 px en CSS — un ratio fixe défini par la spécification CSS,
// indépendant de la résolution réelle de l'imprimante thermique. On peut
// donc s'en servir de façon fiable pour calculer combien de place le
// contenu doit occuper sur le papier.
const MM_VERS_PX = 96 / 25.4;
const HAUTEUR_PAPIER_MM = 130;
const MARGE_MM = 2;
const HAUTEUR_UTILE_MM = HAUTEUR_PAPIER_MM - MARGE_MM * 2;

/**
 * Fait en sorte que le bon remplisse toujours exactement la hauteur de
 * l'étiquette 76×130mm, quelle que soit la quantité d'informations qu'il
 * contient : le contenu est agrandi si la commande est courte (peu
 * d'articles), et réduit s'il y a beaucoup d'articles — plutôt qu'une
 * taille de police fixe, trop petite pour une commande simple et
 * potentiellement trop grande pour une commande à rallonge.
 */
export function BonAutoEchelle({ children }: { children: React.ReactNode }) {
  const contenuRef = useRef<HTMLDivElement>(null);
  const [echelle, setEchelle] = useState(1);

  useEffect(() => {
    function recalculer() {
      const el = contenuRef.current;
      if (!el) return;
      const hauteurNaturellePx = el.scrollHeight;
      if (hauteurNaturellePx === 0) return;
      const hauteurUtilePx = HAUTEUR_UTILE_MM * MM_VERS_PX;
      // On borne l'échelle pour éviter un texte ridiculement énorme (une
      // commande à un seul article) ou illisible (des dizaines d'articles).
      const nouvelleEchelle = Math.min(Math.max(hauteurUtilePx / hauteurNaturellePx, 0.55), 2.2);
      setEchelle(nouvelleEchelle);
    }

    recalculer();
    // Un court délai pour laisser les polices/icônes finir de se charger
    // avant la mesure — sinon la hauteur naturelle peut être sous-évaluée.
    const t = setTimeout(recalculer, 300);
    window.addEventListener("beforeprint", recalculer);
    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeprint", recalculer);
    };
  }, []);

  return (
    <div
      ref={contenuRef}
      style={{ ["--bon-echelle" as string]: echelle }}
      className="print:origin-top-left print:[transform:scale(var(--bon-echelle))]"
    >
      {children}
    </div>
  );
}
