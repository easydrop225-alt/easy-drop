"use client";

import { useState, useTransition } from "react";
import { ArrowLeftRight } from "lucide-react";
import { basculerVersCompte } from "@/app/admin/comptes-lies/actions";

/**
 * N'affiche rien tant qu'aucun compte n'est lié (voir Paramètres > Comptes
 * liés) — pour ne jamais encombrer l'en-tête des personnes qui n'utilisent
 * pas cette fonctionnalité. La liste est fournie par le layout (déjà
 * récupérée côté serveur, en parallèle des autres données de l'en-tête)
 * plutôt que refetchée ici, pour ne pas ajouter de requête supplémentaire
 * après le chargement de la page.
 */
export function CompteSwitcher({
  liens,
}: {
  liens: { lienId: string; compteCibleId: string; label: string }[];
}) {
  const [ouvert, setOuvert] = useState(false);
  const [pending, startTransition] = useTransition();

  if (liens.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        className="rounded-lg p-2 text-ink-900/70 transition hover:bg-beige-100 hover:text-ink-900"
        aria-label="Changer de compte"
        title="Changer de compte"
      >
        <ArrowLeftRight size={20} />
      </button>
      {ouvert && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-ink-900/10 bg-surface p-1.5 shadow-lg">
          <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-900/40">
            Basculer vers
          </p>
          {liens.map((lien) => (
            <button
              key={lien.lienId}
              type="button"
              disabled={pending}
              onClick={() => {
                setOuvert(false);
                startTransition(() => { basculerVersCompte(lien.compteCibleId); });
              }}
              className="block w-full rounded-lg px-2 py-2 text-left text-sm text-ink-900/80 hover:bg-beige-100"
            >
              {lien.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
