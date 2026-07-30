import { createClient } from "@/lib/supabase/server";
import { CommerciauxFiltres } from "@/components/commerciaux/commerciaux-filtres";
import { calculerBonusParrainage, premierJourDuMois } from "@/lib/parrainage";
import type { Profile, Order } from "@/types/database";

export default async function AdminCommerciauxPage() {
  const supabase = await createClient();
  const debutMois = premierJourDuMois(new Date());

  const [{ data: commerciaux }, { data: orders }, { data: pointsCeMois }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "commercial").order("created_at", { ascending: false }),
    supabase.from("orders").select("commercial_id, statut, created_at").eq("statut", "livree"),
    supabase.from("points_parrainage").select("parrain_id, filleul_id").gte("created_at", debutMois),
  ]);

  const list = (commerciaux ?? []) as Profile[];
  const enAttente = list.filter((c) => c.statut === "en_attente").length;

  const performanceParId: Record<string, number> = {};
  const ventesCeMoisParId: Record<string, number> = {};
  for (const o of (orders ?? []) as Pick<Order, "commercial_id" | "statut" | "created_at">[]) {
    performanceParId[o.commercial_id] = (performanceParId[o.commercial_id] ?? 0) + 1;
    if (o.created_at >= debutMois) {
      ventesCeMoisParId[o.commercial_id] = (ventesCeMoisParId[o.commercial_id] ?? 0) + 1;
    }
  }

  const filleulsParParrain: Record<string, string[]> = {};
  for (const c of list) {
    if (c.parrain_id) {
      if (!filleulsParParrain[c.parrain_id]) filleulsParParrain[c.parrain_id] = [];
      filleulsParParrain[c.parrain_id]!.push(c.id);
    }
  }

  const pointsParParrain: Record<string, { total: number; filleulsActifs: Set<string> }> = {};
  for (const pt of (pointsCeMois ?? []) as { parrain_id: string; filleul_id: string }[]) {
    if (!pointsParParrain[pt.parrain_id]) pointsParParrain[pt.parrain_id] = { total: 0, filleulsActifs: new Set() };
    pointsParParrain[pt.parrain_id]!.total += 1;
    pointsParParrain[pt.parrain_id]!.filleulsActifs.add(pt.filleul_id);
  }

  const nomParId = new Map(list.map((c) => [c.id, `${c.prenom} ${c.nom}`]));

  const parrainageParId: Record<string, {
    nomParrain: string | null; filleuls: number; filleulsActifs: number; points: number; niveau: string; bonusEstime: number;
  }> = {};
  for (const c of list) {
    const points = pointsParParrain[c.id]?.total ?? 0;
    const ventesPerso = ventesCeMoisParId[c.id] ?? 0;
    const { niveau, montant } = calculerBonusParrainage(points, ventesPerso);
    parrainageParId[c.id] = {
      nomParrain: c.parrain_id ? nomParId.get(c.parrain_id) ?? null : null,
      filleuls: filleulsParParrain[c.id]?.length ?? 0,
      filleulsActifs: pointsParParrain[c.id]?.filleulsActifs.size ?? 0,
      points,
      niveau,
      bonusEstime: montant,
    };
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Commerciaux</h1>
        {enAttente > 0 && (
          <a href="/admin/commerciaux/validation" className="rounded-xl bg-terracotta-500 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-600">
            {enAttente} en attente de validation
          </a>
        )}
      </div>
      <CommerciauxFiltres commerciaux={list} performanceParId={performanceParId} parrainageParId={parrainageParId} />
    </div>
  );
}
