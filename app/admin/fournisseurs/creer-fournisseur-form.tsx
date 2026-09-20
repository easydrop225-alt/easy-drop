"use client";

import { useState, useTransition } from "react";
import { creerFournisseur, desactiverFournisseur } from "../fournisseurs-actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import type { Profile } from "@/types/database";

export function CreerFournisseurForm({ fournisseurs }: { fournisseurs: Profile[] }) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  function handleCreer() {
    setError(null);
    setSucces(null);
    startTransition(async () => {
      const res = await creerFournisseur({ nom, prenom, telephone, email: email || undefined, motDePasse, nomEntreprise: nomEntreprise || undefined });
      if (res?.error) setError(res.error);
      else {
        setSucces(`Compte créé — identifiant de connexion : ${res?.email}`);
        setNom(""); setPrenom(""); setTelephone(""); setEmail(""); setNomEntreprise(""); setMotDePasse("");
      }
    });
  }

  return (
    <div className="space-y-6">
      {fournisseurs.length > 0 && (
        <div className="space-y-2">
          {fournisseurs.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-xl bg-beige-100 px-3 py-2 text-sm">
              <span>
                🏭 {f.prenom} {f.nom}
                {f.nom_boutique && <span className="text-ink-900/50"> — {f.nom_boutique}</span>}
                {f.statut === "desactive" && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Suspendu</span>}
              </span>
              {f.statut !== "desactive" && (
                <button
                  type="button"
                  onClick={() => startTransition(() => { desactiverFournisseur(f.id); })}
                  className="text-xs text-red-600 underline"
                >
                  Suspendre
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3 rounded-xl border border-ink-900/10 p-4">
        <h3 className="font-medium">Ajouter un fournisseur</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><Label htmlFor="fPrenom">Prénom</Label><Input id="fPrenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} /></div>
          <div><Label htmlFor="fNom">Nom</Label><Input id="fNom" value={nom} onChange={(e) => setNom(e.target.value)} /></div>
        </div>
        <div><Label htmlFor="fEntreprise">Nom de l&apos;entreprise (optionnel)</Label><Input id="fEntreprise" value={nomEntreprise} onChange={(e) => setNomEntreprise(e.target.value)} /></div>
        <div><Label htmlFor="fTelephone">Téléphone</Label><Input id="fTelephone" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+225 ..." /></div>
        <div><Label htmlFor="fEmail">Email (optionnel — sinon généré depuis le téléphone)</Label><Input id="fEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div>
          <Label htmlFor="fMotDePasse">Mot de passe initial</Label>
          <PasswordInput id="fMotDePasse" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {succes && <p className="text-sm text-emerald-600">{succes}</p>}
        <Button type="button" disabled={pending || !nom || !prenom || !telephone || !motDePasse} onClick={handleCreer}>
          {pending ? "Création..." : "Créer le compte fournisseur"}
        </Button>
        <p className="text-xs text-ink-900/50">
          Communique-lui son identifiant de connexion et ce mot de passe par un autre moyen (WhatsApp, appel...).
        </p>
      </div>
    </div>
  );
}
