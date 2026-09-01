"use client";

import { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Champ mot de passe avec bouton œil pour afficher/masquer la saisie.
 * S'utilise exactement comme un <Input type="password" /> classique.
 */
export const PasswordInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn(
            "h-10 w-full rounded-xl border border-ink-900/10 bg-surface px-3 pr-10 text-sm",
            className
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-900/40 hover:text-ink-900/70"
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

const CRITERES = [
  { label: "6 caractères minimum", test: (v: string) => v.length >= 6 },
  { label: "Une majuscule", test: (v: string) => /[A-Z]/.test(v) },
  { label: "Une minuscule", test: (v: string) => /[a-z]/.test(v) },
  { label: "Un chiffre", test: (v: string) => /\d/.test(v) },
  { label: "Un symbole (ex: ! ? # @ %)", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

/**
 * Liste des critères de complexité du mot de passe, avec coche verte dès
 * que chaque critère est respecté pendant la saisie.
 */
export function ExigencesMotDePasse({ valeur }: { valeur: string }) {
  return (
    <ul className="mt-1.5 space-y-0.5">
      {CRITERES.map((c) => {
        const ok = c.test(valeur);
        return (
          <li key={c.label} className={cn("text-xs", ok ? "text-green-600" : "text-ink-900/40")}>
            {ok ? "✓" : "○"} {c.label}
          </li>
        );
      })}
    </ul>
  );
}

/** Utilisé côté serveur/tests pour vérifier qu'un mot de passe respecte bien tous les critères. */
export function motDePasseValide(valeur: string): boolean {
  return CRITERES.every((c) => c.test(valeur));
}
