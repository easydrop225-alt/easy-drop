import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CommerciauxFiltres } from "@/components/commerciaux/commerciaux-filtres";
import type { Profile, Order } from "@/types/database";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Commerciaux" };


export default async function AdminCommerciauxPage() {
  const supabase = await createClient();

  const [{ data: commerciaux }, { data: orders }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "commercial").order("created_at", { ascending: false }),
    supabase.from("orders").select("commercial_id, statut").eq("statut", "livree"),
  ]);

  const list = (commerciaux ?? []) as Profile[];
  const enAttente = list.filter((c) => c.statut === "en_attente").length;

  const performanceParId: Record<string, number> = {};
  for (const o of (orders ?? []) as Pick<Order, "commercial_id" | "statut">[]) {
    performanceParId[o.commercial_id] = (performanceParId[o.commercial_id] ?? 0) + 1;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Commerciaux</h1>
        {enAttente > 0 && (
          <Link href="/admin/commerciaux/validation" className="rounded-xl bg-terracotta-500 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-600">
            {enAttente} en attente de validation
          </Link>
        )}
      </div>
      <CommerciauxFiltres commerciaux={list} performanceParId={performanceParId} />
    </div>
  );
}
