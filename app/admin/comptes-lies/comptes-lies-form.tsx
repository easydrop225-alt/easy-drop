"use client";

import { useState, useTransition } from "react";
import { lierCompte, delierCompte } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

export function ComptesLiesForm({
  liens,
}: {
  liens: { lienId: string; compteCibleId: string; label: string }[];
}) {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "erreur"; texte: string } | null>(null);

  function handleLier() {
    setMessage(null);
    startTransition(async () => {
      const res = await lierCompte(email, motDePasse);
      if (res?.error) setMessage({ type: "erreur", texte: res.error });
      else {
        setMessage({ type: "ok", texte: `Compte "${res?.label}" lié avec succès ✓` });
        setEmail("");
        setMotDePasse("");
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-900/50">
        Une fois lié, un bouton apparaît en haut de l&apos;écran pour basculer instantanément vers ce compte, sans jamais retaper de mot de passe. Réservé au super administrateur.
      </p>

      {liens.length > 0 && (
        <div className="space-y-2">
          {liens.map((lien) => (
            <div key={lien.lienId} className="flex items-center justify-between rounded-xl bg-beige-100 px-3 py-2 text-sm">
              <span>🔗 {lien.label}</span>
              <button
                type="button"
                onClick={() => startTransition(() => { delierCompte(lien.lienId); })}
                className="text-xs text-red-600 underline"
              >
                Délier
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 rounded-xl border border-ink-900/10 p-3">
        <Label htmlFor="emailCompteALier">Email du compte à lier</Label>
        <Input id="emailCompteALier" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="test@exemple.com" />
        <Label htmlFor="motDePasseCompteALier">Mot de passe de ce compte</Label>
        <PasswordInput id="motDePasseCompteALier" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
        <p className="text-xs text-ink-900/40">
          Demandé une seule fois, uniquement pour établir le lien — plus jamais ensuite.
        </p>
        <Button type="button" size="sm" disabled={pending || !email || !motDePasse} onClick={handleLier}>
          {pending ? "Liaison..." : "Lier ce compte"}
        </Button>
      </div>

      {message && (
        <p className={`text-sm ${message.type === "ok" ? "text-green-600" : "text-red-600"}`}>{message.texte}</p>
      )}
    </div>
  );
}
