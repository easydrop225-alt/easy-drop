import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";
import type { Product } from "@/types/database";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mes produits" };

const BADGE: Record<string, { label: string; classe: string }> = {
  en_attente: { label: "⏳ En attente de validation", classe: "bg-amber-100 text-amber-700" },
  valide: { label: "✓ Validé — visible aux commerciaux", classe: "bg-emerald-100 text-emerald-700" },
  refuse: { label: "✕ Refusé", classe: "bg-red-100 text-red-700" },
};

export default async function FournisseurProduitsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const { data: produits } = await supabase
    .from("products")
    .select("*")
    .eq("fournisseur_id", session?.user.id ?? "")
    .order("created_at", { ascending: false });

  const list = (produits ?? []) as Product[];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mes produits</h1>
        <Link href="/fournisseur/produits/nouveau" className="rounded-xl bg-terracotta-500 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-600">
          + Ajouter un produit
        </Link>
      </div>

      {list.length === 0 && <p className="text-ink-900/60">Tu n&apos;as encore ajouté aucun produit.</p>}

      <div className="space-y-3">
        {list.map((p) => {
          const badge = BADGE[p.statut_validation] ?? BADGE.en_attente!;
          return (
            <Link key={p.id} href={`/fournisseur/produits/${p.id}/edit`}>
              <Card className="hover:bg-beige-100">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{p.nom}</p>
                    <p className="text-sm text-ink-900/60">Ton prix : {formatFCFA(p.prix_fournisseur_externe_brut ?? 0)}</p>
                    {p.statut_validation === "refuse" && p.motif_refus && (
                      <p className="mt-1 text-xs text-red-600">Motif : {p.motif_refus}</p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${badge.classe}`}>{badge.label}</span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
