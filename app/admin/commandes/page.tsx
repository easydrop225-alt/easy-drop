import { createClient } from "@/lib/supabase/server";
import { CommandesGroupeesAdmin, type OrderComplete } from "@/components/commandes/commandes-groupees-admin";
import type { Media } from "@/types/database";

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

  const productIds = Array.from(new Set(list.flatMap((o) => o.order_items.map((i) => i.product_id))));
  const { data: media } = productIds.length
    ? await supabase.from("media").select("*").in("product_id", productIds).eq("type", "image").order("ordre")
    : { data: [] as Media[] };

  const imageParProduit: Record<string, string | undefined> = {};
  for (const m of (media ?? []) as Media[]) {
    if (!(m.product_id in imageParProduit)) imageParProduit[m.product_id] = m.url;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold">Toutes les commandes</h1>
        <p className="text-sm text-ink-900/50">{total} commande{total !== 1 ? "s" : ""} au total</p>
      </div>
      <CommandesGroupeesAdmin orders={list} imageParProduit={imageParProduit} />

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          <a
            href={page > 1 ? `/admin/commandes?page=${page - 1}` : undefined}
            aria-disabled={page <= 1}
            className={`rounded-lg border border-ink-900/10 px-3 py-1.5 ${
              page <= 1 ? "pointer-events-none opacity-30" : "hover:bg-beige-100"
            }`}
          >
            ← Précédent
          </a>
          <span className="text-ink-900/60">Page {page} sur {totalPages}</span>
          <a
            href={page < totalPages ? `/admin/commandes?page=${page + 1}` : undefined}
            aria-disabled={page >= totalPages}
            className={`rounded-lg border border-ink-900/10 px-3 py-1.5 ${
              page >= totalPages ? "pointer-events-none opacity-30" : "hover:bg-beige-100"
            }`}
          >
            Suivant →
          </a>
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
