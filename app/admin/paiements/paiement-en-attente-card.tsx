"use client";

import { useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { enregistrerPaiement } from "./actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatFCFA, formatDate } from "@/lib/utils";
import type { Profile } from "@/types/database";

interface CommandeDue {
  orderId: string;
  numeroCommande: string;
  montant: number;
}

export function PaiementEnAttenteCard({
  commercial,
  montantDu,
  dateDebut,
  dateFin,
  commandes,
}: {
  commercial: Profile;
  montantDu: number;
  dateDebut: string;
  dateFin: string;
  commandes: CommandeDue[];
}) {
  const [ouvert, setOuvert] = useState(false);
  const [mode, setMode] = useState<"wave" | "orange_money" | "especes">("wave");
  const [numeroDepot, setNumeroDepot] = useState(commercial.telephone);
  const [preuveFile, setPreuveFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  // Toutes les commandes sont cochées par défaut (cas le plus courant : le
  // versement couvre tout ce qui est dû) — mais peuvent être décochées si
  // le montant réellement versé ne couvre qu'une partie.
  const [selection, setSelection] = useState<Set<string>>(new Set(commandes.map((c) => c.orderId)));
  const supabase = createClient();

  const montantSelectionne = useMemo(
    () => commandes.filter((c) => selection.has(c.orderId)).reduce((a, c) => a + c.montant, 0),
    [commandes, selection]
  );

  function basculer(orderId: string) {
    setSelection((s) => {
      const copie = new Set(s);
      if (copie.has(orderId)) copie.delete(orderId);
      else copie.add(orderId);
      return copie;
    });
  }

  function handleEnregistrer() {
    setError(null);
    if (selection.size === 0) {
      setError("Sélectionne au moins une commande couverte par ce versement.");
      return;
    }
    startTransition(async () => {
      try {
        let preuveUrl: string | undefined;
        if (preuveFile) {
          const path = `${commercial.id}/${Date.now()}-${preuveFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
          const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(path, preuveFile);
          if (uploadError) throw uploadError;
          const { data } = supabase.storage.from("payment-proofs").getPublicUrl(path);
          preuveUrl = data.publicUrl;
        }

        const res = await enregistrerPaiement({
          commercialId: commercial.id,
          montant: montantSelectionne,
          mode,
          numeroDepot,
          preuveUrl,
          orderIds: Array.from(selection),
        });

        if (res?.error) setError(res.error);
        else setDone(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
      }
    });
  }

  if (done) {
    return (
      <Card className="text-sm text-emerald-600">
        Paiement de {formatFCFA(montantSelectionne)} enregistré pour {commercial.prenom} {commercial.nom} ({selection.size} commande{selection.size > 1 ? "s" : ""}) ✓
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">
            {commercial.prenom} {commercial.nom}
            {commercial.nom_boutique && <span className="ml-2 rounded-full bg-beige-100 px-2 py-0.5 text-xs font-normal">🏪 {commercial.nom_boutique}</span>}
          </p>
          <p className="text-xs text-ink-900/50">
            Commandes du {formatDate(dateDebut)} au {formatDate(dateFin)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-900/50">Montant dû</p>
          <p className="text-lg font-semibold text-terracotta-600">{formatFCFA(montantDu)}</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setOuvert(!ouvert)}>
          {ouvert ? "Fermer" : "Enregistrer le versement"}
        </Button>
      </div>

      {ouvert && (
        <div className="mt-4 space-y-3 border-t border-ink-900/5 pt-4">
          <div>
            <p className="mb-2 text-sm font-medium">
              Commandes couvertes par ce versement ({selection.size}/{commandes.length})
            </p>
            <p className="mb-2 text-xs text-ink-900/50">
              Décoche celles que ce versement ne couvre pas encore — seules les commandes cochées seront marquées "payées".
            </p>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-ink-900/10 p-2">
              {commandes.map((c) => (
                <label key={c.orderId} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-beige-100">
                  <span className="flex items-center gap-2">
                    <input type="checkbox" checked={selection.has(c.orderId)} onChange={() => basculer(c.orderId)} />
                    {c.numeroCommande}
                  </span>
                  <span className="font-medium">{formatFCFA(c.montant)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`mode-${commercial.id}`}>Mode de paiement</Label>
              <select
                id={`mode-${commercial.id}`}
                value={mode}
                onChange={(e) => setMode(e.target.value as "wave" | "orange_money" | "especes")}
                className="h-10 w-full rounded-xl border border-ink-900/10 bg-surface px-3 text-sm"
              >
                <option value="wave">Wave</option>
                <option value="orange_money">Orange Money</option>
                <option value="especes">Espèces</option>
              </select>
            </div>
            <div>
              <Label htmlFor={`depot-${commercial.id}`}>Numéro de dépôt</Label>
              <Input
                id={`depot-${commercial.id}`}
                value={numeroDepot}
                onChange={(e) => setNumeroDepot(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor={`preuve-${commercial.id}`}>Preuve du dépôt (capture d'écran ou reçu)</Label>
            <input
              id={`preuve-${commercial.id}`}
              type="file"
              accept="image/*"
              onChange={(e) => setPreuveFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button size="sm" disabled={pending || selection.size === 0} onClick={handleEnregistrer}>
            {pending ? "Enregistrement..." : `Confirmer le versement de ${formatFCFA(montantSelectionne)}`}
          </Button>
        </div>
      )}
    </Card>
  );
}
