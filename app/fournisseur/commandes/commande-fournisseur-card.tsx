"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { formatFCFA, formatDate } from "@/lib/utils";
import { changerStatutCommandeFournisseur, mettreAJourPreparationFournisseur } from "./actions";
import type { Order, OrderItem, Product, OrderStatut } from "@/types/database";

const LABEL_STATUT: Record<OrderStatut, string> = {
  confirmation: "🟡 Confirmation",
  traitement: "🔵 En traitement",
  livraison: "🚚 En cours de livraison",
  livree: "🟢 Livrée",
  annulee: "🔴 Annulée",
  relance: "🟠 À relancer",
};

const LABEL_PREP: Record<string, string> = {
  en_attente: "⏳ En attente",
  pret: "✓ Prêt",
  expedie: "📦 Expédié",
};

export function CommandeFournisseurCard({
  order,
  monId,
}: {
  order: Order & { order_items: (OrderItem & { products: Product })[] };
  monId: string;
}) {
  const [pending, startTransition] = useTransition();
  const mesLignes = order.order_items.filter((i) => i.products?.fournisseur_id === monId);
  const autresLignes = order.order_items.filter((i) => i.products?.fournisseur_id !== monId);
  const commandeEntierementAMoi = autresLignes.length === 0;

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{order.numero_commande}</p>
          <p className="text-xs text-ink-900/50">{formatDate(order.created_at)}</p>
        </div>
        <span className="rounded-full bg-beige-100 px-2 py-1 text-xs font-medium">{LABEL_STATUT[order.statut]}</span>
      </div>

      <div className="mb-3 rounded-xl bg-beige-100 p-3 text-sm">
        <p className="text-xs uppercase text-ink-900/50">Client (livraison)</p>
        <p className="font-medium">{order.client_nom}</p>
        <p>{order.client_telephone}</p>
        <p className="text-ink-900/70">{order.client_adresse}, {order.client_commune}</p>
      </div>

      <div className="mb-3 space-y-1">
        <p className="text-xs uppercase text-ink-900/50">Tes produits dans cette commande</p>
        {mesLignes.map((l) => (
          <p key={l.id} className="text-sm">
            <span className="font-medium">{l.quantite}×</span> {l.products?.nom}
          </p>
        ))}
      </div>

      {!commandeEntierementAMoi && (
        <p className="mb-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-700">
          Cette commande contient aussi {autresLignes.length} autre(s) produit(s) qui ne sont pas les tiens — tu ne peux mettre à jour que la préparation de tes propres produits, pas le statut global.
        </p>
      )}

      {commandeEntierementAMoi ? (
        <div>
          <label className="mb-1 block text-xs uppercase text-ink-900/50">Statut de la commande</label>
          <select
            value={order.statut}
            disabled={pending}
            onChange={(e) => startTransition(() => { changerStatutCommandeFournisseur(order.id, e.target.value as OrderStatut); })}
            className="h-10 w-full rounded-xl border border-ink-900/10 bg-surface px-3 text-sm"
          >
            {Object.entries(LABEL_STATUT).map(([valeur, label]) => (
              <option key={valeur} value={valeur}>{label}</option>
            ))}
          </select>
        </div>
      ) : (
        <div className="space-y-2">
          {mesLignes.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-2">
              <span className="text-sm">{l.products?.nom}</span>
              <select
                value={l.statut_preparation_fournisseur ?? "en_attente"}
                disabled={pending}
                onChange={(e) => startTransition(() => { mettreAJourPreparationFournisseur(l.id, e.target.value as "en_attente" | "pret" | "expedie"); })}
                className="h-9 rounded-lg border border-ink-900/10 bg-surface px-2 text-xs"
              >
                {Object.entries(LABEL_PREP).map(([valeur, label]) => (
                  <option key={valeur} value={valeur}>{label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
