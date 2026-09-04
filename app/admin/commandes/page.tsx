import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CommandesGroupeesAdmin, type OrderComplete } from "@/components/commandes/commandes-groupees-admin";
import type { Media } from "@/types/database";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Commandes" };


const TAILLE_PAGE = 100;

export default async function AdminCommandesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const debut = (page - 1) * TAILLE_PAGE;
  const fin = debut + TAILLE_PAGE - 1;

  const supabase = await createClient();

  // Vraie pagination : seules les TAILLE_PAGE commandes de la page demandée
  // sont chargées (avec leurs produits/variantes), quel que soit le nombre
  // total de commandes sur la plateforme — contrairement à l'ancien plafond
  // fixe à 1000, qui aurait fini par cacher les commandes les plus
  // anciennes une fois ce chiffre dépassé.
  const [{ data: orders }, { count: totalCommandes }] = await Promise.all([
    supabase
      .from("orders")
      .select("*, profiles(nom, prenom, telephone, nom_boutique), order_items(*, products(*), product_variants(*))")
      .order("created_at", { ascending: false })
      .range(debut, fin),
    supabase.from("orders").select("id", { count: "exact", head: true }),
  ]);

  const list = (orders ?? []) as OrderComplete[];
  const total = totalCommandes ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / TAILLE_PAGE));

  const orderIds = list.map((o) => o.id);
  const productIds = Array.from(new Set(list.flatMap((o) => o.order_items.map((i) => i.product_id))));
  const [{ data: media }, { data: profits }] = await Promise.all([
    productIds.length
      ? supabase.from("media").select("*").in("product_id", productIds).eq("type", "image").order("ordre")
      : Promise.resolve({ data: [] as Media[] }),
    orderIds.length
      ? supabase.from("profits").select("order_id, montant_benefice, statut").in("order_id", orderIds)
      : Promise.resolve({ data: [] as { order_id: string; montant_benefice: number; statut: string }[] }),
  ]);

  const imageParProduit: Record<string, string | undefined> = {};
  for (const m of (media ?? []) as Media[]) {
    if (!(m.product_id in imageParProduit)) imageParProduit[m.product_id] = m.url;
  }

  // Une commande peut avoir plusieurs lignes (panier multi-produits), donc
  // plusieurs lignes de profit pour un même order_id — il faut les additionner
  // (jamais garder juste la dernière vue) et ne considérer la commande comme
  // "payée" que si TOUTES ses lignes de bénéfice le sont.
  const profitParOrderId: Record<string, { montant: number; statut: string }> = {};
  const tousPayesParOrderId: Record<string, boolean> = {};
  for (const p of profits ?? []) {
    const existant = profitParOrderId[p.order_id];
    profitParOrderId[p.order_id] = { montant: (existant?.montant ?? 0) + p.montant_benefice, statut: p.statut };
    tousPayesParOrderId[p.order_id] = (tousPayesParOrderId[p.order_id] ?? true) && p.statut === "paye";
  }
  for (const orderId of Object.keys(profitParOrderId)) {
    profitParOrderId[orderId]!.statut = tousPayesParOrderId[orderId] ? "paye" : "en_attente";
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold">Toutes les commandes</h1>
        <p className="text-sm text-ink-900/50">{total} commande{total !== 1 ? "s" : ""} au total</p>
      </div>
      <CommandesGroupeesAdmin orders={list} imageParProduit={imageParProduit} profitParOrderId={profitParOrderId} />

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          <Link
            href={page > 1 ? `/admin/commandes?page=${page - 1}` : `/admin/commandes?page=${page}`}
            aria-disabled={page <= 1}
            className={`rounded-lg border border-ink-900/10 px-3 py-1.5 ${
              page <= 1 ? "pointer-events-none opacity-30" : "hover:bg-beige-100"
            }`}
          >
            ← Précédent
          </Link>
          <span className="text-ink-900/60">Page {page} sur {totalPages}</span>
          <Link
            href={page < totalPages ? `/admin/commandes?page=${page + 1}` : `/admin/commandes?page=${page}`}
            aria-disabled={page >= totalPages}
            className={`rounded-lg border border-ink-900/10 px-3 py-1.5 ${
              page >= totalPages ? "pointer-events-none opacity-30" : "hover:bg-beige-100"
            }`}
          >
            Suivant →
          </Link>
        </div>
      )}
      {totalPages > 1 && (
        <p className="mt-2 text-center text-xs text-ink-900/40">
          Les filtres (statut, date) ci-dessus s&apos;appliquent uniquement à la page affichée — change de page pour voir les commandes plus anciennes.
        </p>
      )}
    </div>
  );
}
