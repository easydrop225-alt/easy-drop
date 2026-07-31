"use client";

import { useState, useTransition } from "react";
import { terminerOnboarding } from "@/app/(commercial)/onboarding/actions";
import { Button } from "@/components/ui/button";

const ETAPES = [
  {
    titre: "Bienvenue sur Easy Drop 👋",
    contenu: "Vends nos produits, on s'occupe de la préparation et de la livraison. Ce petit guide te montre l'essentiel en 4 écrans rapides.",
  },
  {
    titre: "Créer une commande",
    contenu: "Appuie sur le bouton ➕ en bas de l'écran à tout moment pour enregistrer une nouvelle vente : choisis le produit, la variante, indique le prix et les infos du client.",
  },
  {
    titre: "Suivre tes gains",
    contenu: "L'onglet \"Mes gains\" te montre ce qui est en attente de paiement et ce qui t'a déjà été versé. L'onglet \"Commandes\" te montre l'avancement de chaque vente.",
  },
  {
    titre: "Active tes notifications 🔔",
    contenu: "Autorise les notifications quand ton téléphone te le demande — tu seras averti dès qu'une de tes commandes change de statut, même appli fermée.",
  },
  {
    titre: "Installe l'application 📲",
    contenu: "Si la proposition d'installation n'apparaît pas automatiquement : sur Chrome (Android), ouvre le menu ⋮ en haut à droite → \"Installer l'application\". Sur iPhone (Safari), appuie sur Partager → \"Sur l'écran d'accueil\".",
  },
];

export function OnboardingTutoriel() {
  const [etape, setEtape] = useState(0);
  const [ferme, setFerme] = useState(false);
  const [pending, startTransition] = useTransition();

  if (ferme) return null;

  const derniereEtape = etape === ETAPES.length - 1;
  const contenu = ETAPES[etape];

  function terminer() {
    startTransition(async () => {
      await terminerOnboarding();
      setFerme(true);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6">
        <div className="mb-4 flex gap-1">
          {ETAPES.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= etape ? "bg-terracotta-500" : "bg-beige-100"}`} />
          ))}
        </div>
        <h2 className="mb-2 text-lg font-semibold">{contenu?.titre}</h2>
        <p className="mb-6 text-sm text-ink-900/70">{contenu?.contenu}</p>
        <div className="flex items-center justify-between">
          <button onClick={terminer} disabled={pending} className="text-sm text-ink-900/40 hover:text-ink-900/60">
            Passer
          </button>
          <Button
            size="sm"
            disabled={pending}
            onClick={() => (derniereEtape ? terminer() : setEtape((e) => e + 1))}
          >
            {pending ? "..." : derniereEtape ? "C'est parti !" : "Suivant"}
          </Button>
        </div>
      </div>
    </div>
  );
}
