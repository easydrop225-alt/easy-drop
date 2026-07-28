import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { StatutBadge } from "@/components/ui/badge";
import { PeriodChart } from "@/components/rapports/period-chart";
import { CategoryRow } from "@/components/produits/category-row";
import { formatFCFA } from "@/lib/utils";
import { ShoppingBag, ClipboardList, Wallet, Headset } from "lucide-react";
import type { PointJournalier } from "@/lib/stats/aggregate";
import type { Order, OrderItem, Category, Product, Media, Setting } from "@/types/database";

export default async function DashboardCommercialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: ordersData } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("commercial_id", user?.id)
    .order("created_at", { ascending: false });

  const list = ((ordersData ?? []) as (Order & { order_items: OrderItem[] | null })[]).map((o) => ({
    ...o,
    order_items: o.order_items ?? [],
  }));

  // --- Données pour la nouvelle page d'accueil (bannière, catégories, produits vedette) ---
  const { data: settingsData } = await supabase.from("settings").select("*");
  const settings = (settingsData ?? []) as Setting[];
  const getSetting = (cle: string) => settings.find((s) => s.cle === cle)?.valeur;
  const accueilTexte = (getSetting("accueil_texte") as string | undefined)
    ?? "Des produits à prix revendeur, une logistique 100% prise en charge !";
  const modeVedette = (getSetting("produits_vedette_mode") as "statique" | "aleatoire" | undefined) ?? "aleatoire";
  const idsVedette = (getSetting("produits_vedette_ids") as string[] | undefined) ?? [];

  const { data: categoriesData } = await supabase.from("categories").select("*").eq("actif", true).order("ordre");
  const categories = (categoriesData ?? []) as Category[];

  const { data: produitsActifs } = await supabase.from("products").select("*").eq("actif", true);
  const produits = (produitsActifs ?? []) as Product[];

  const compteParCategorie = new Map<string, number>();
  for (const p of produits) {
    if (!p.category_id) continue;
    compteParCategorie.set(p.category_id, (compteParCategorie.get(p.category_id) ?? 0) + 1);
  }

  let produitsVedette: Product[];
  if (modeVedette === "statique" && idsVedette.length > 0) {
    produitsVedette = idsVedette.map((id) => produits.find((p) => p.id === id)).filter((p): p is Product => !!p);
  } else {
    // Rotation aléatoire : l'ordre change à chaque chargement de la page.
    produitsVedette = [...produits].sort(() => Math.random() - 0.5).slice(0, 8);
  }

  const idsPourImages = produitsVedette.map((p) => p.id);
  const { data: mediaVedette } = idsPourImages.length
    ? await supabase.from("media").select("*").in("product_id", idsPourImages).eq("type", "image").order("ordre")
    : { data: [] as Media[] };
  const imageParProduit = new Map<string, string>();
  for (const m of (mediaVedette ?? []) as Media[]) {
    if (!imageParProduit.has(m.product_id)) imageParProduit.set(m.product_id, m.url);
  }

  // --- Indicateurs métier (bénéfices, performance) ---
  const debutJour = new Date(); debutJour.setHours(0, 0, 0, 0);
  const debutJourStr = debutJour.toISOString().slice(0, 10);
  const demain = new Date(debutJour); demain.setDate(demain.getDate() + 1);
  const demainStr = demain.toISOString().slice(0, 10);

  const commandesJour = list.filter(
    (o) =>
      o.created_at.slice(0, 10) === debutJourStr ||
      (o.statut === "relance" && o.date_relance === demainStr)
  );
  const commandesLivreesJour = commandesJour.filter((o) => o.statut === "livree");
  const commandesEnCoursJour = commandesJour.filter((o) => o.statut === "confirmation" || o.statut === "traitement" || o.statut === "livraison" || o.statut === "relance");

  const beneficeAttendu = commandesEnCoursJour.reduce(
    (acc, o) => acc + o.order_items.reduce((a, i) => a + Number(i.benefice_ligne), 0), 0
  );
  const beneficeRealiseJour = commandesLivreesJour.reduce(
    (acc, o) => acc + o.order_items.reduce((a, i) => a + Number(i.benefice_ligne), 0), 0
  );

  const commandesLivreesTotal = list.filter((o) => o.statut === "livree").length;
  const commandesNonLivreesTotal = list.filter((o) => o.statut === "annulee").length;
  const resolues = commandesLivreesTotal + commandesNonLivreesTotal;
  const tauxReussite = resolues > 0 ? Math.round((commandesLivreesTotal / resolues) * 100) : 0;

  const beneficeParJour = new Map<string, number>();
  for (const o of list) {
    if (o.statut !== "livree") continue;
    const jour = o.created_at.slice(0, 10);
    const benef = o.order_items.reduce((a, i) => a + Number(i.benefice_ligne), 0);
    beneficeParJour.set(jour, (beneficeParJour.get(jour) ?? 0) + benef);
  }
  const pointsBenefice: PointJournalier[] = Array.from(beneficeParJour.entries()).map(([date, valeur]) => ({ date, valeur }));

  const dernieresCommandes = list.slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Bannière d'accueil — texte modifiable par l'admin dans Paramètres. */}
      <div className="overflow-hidden rounded-2xl bg-ink-900 p-6 text-beige-50">
        <p className="max-w-xs text-lg font-semibold leading-snug">{accueilTexte}</p>
      </div>

      {/* Accès rapides, à la manière d'une application mobile. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <a href="/catalogue" className="flex flex-col items-center gap-2 rounded-2xl border border-ink-900/5 bg-white p-4 text-center hover:shadow-md">
          <ShoppingBag className="text-terracotta-500" />
          <span className="text-xs font-medium">Produits disponibles</span>
        </a>
        <a href="/commandes" className="flex flex-col items-center gap-2 rounded-2xl border border-ink-900/5 bg-white p-4 text-center hover:shadow-md">
          <ClipboardList className="text-terracotta-500" />
          <span className="text-xs font-medium">Mes commandes</span>
        </a>
        <a href="/gains" className="flex flex-col items-center gap-2 rounded-2xl border border-ink-900/5 bg-white p-4 text-center hover:shadow-md">
          <Wallet className="text-terracotta-500" />
          <span className="text-xs font-medium">Mes gains</span>
        </a>
        <a href="/profil" className="flex flex-col items-center gap-2 rounded-2xl border border-ink-900/5 bg-white p-4 text-center hover:shadow-md">
          <Headset className="text-terracotta-500" />
          <span className="text-xs font-medium">Support 24/7</span>
        </a>
      </div>

      {/* Catégories */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Catégories</h2>
          <a href="/catalogue" className="text-sm text-terracotta-600 underline">Voir tout</a>
        </div>
        <CategoryRow categories={categories} compteParCategorie={compteParCategorie} hrefPrefix="/catalogue/categorie" />
      </div>

      {/* Produits populaires / vedette */}
      {produitsVedette.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Produits populaires</h2>
            <a href="/catalogue" className="text-sm text-terracotta-600 underline">Voir tout</a>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {produitsVedette.map((p) => (
              <a
                key={p.id}
                href={`/catalogue/${p.id}`}
                className="w-36 shrink-0 overflow-hidden rounded-2xl border border-ink-900/5 bg-white transition hover:shadow-md"
              >
                <div className="aspect-square bg-beige-100">
                  {imageParProduit.get(p.id) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageParProduit.get(p.id)} alt={p.nom} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-ink-900/30">Photo</div>
                  )}
                </div>
                <div className="p-2">
                  <p className="truncate text-xs font-medium">{p.nom}</p>
                  <p className="text-xs text-ink-900/50">{formatFCFA(p.prix_fournisseur)}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-medium">Aujourd'hui</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardTitle>Bénéfice attendu</CardTitle>
            <CardValue>{formatFCFA(beneficeAttendu)}</CardValue>
            <p className="mt-1 text-xs text-ink-900/40">Commandes en cours (non résolues)</p>
          </Card>
          <Card>
            <CardTitle>Bénéfice réalisé</CardTitle>
            <CardValue>{formatFCFA(beneficeRealiseJour)}</CardValue>
            <p className="mt-1 text-xs text-ink-900/40">Commandes livrées avec succès</p>
          </Card>
          <Card>
            <CardTitle>Commandes aujourd'hui</CardTitle>
            <CardValue>{commandesJour.length}</CardValue>
          </Card>
          <Card>
            <CardTitle>Taux de réussite (global)</CardTitle>
            <CardValue>{tauxReussite}%</CardValue>
          </Card>
        </div>
      </div>

      <PeriodChart
        title="Ma performance (bénéfice réalisé)"
        data={pointsBenefice}
        type="line"
        defaultGranularite="semaine"
        unite="fcfa"
      />

      <div>
        <h2 className="mb-3 text-lg font-medium">Mes commandes du jour</h2>
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
                <th className="p-3">Numéro</th>
                <th className="p-3">Client</th>
                <th className="p-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {commandesJour.map((order) => (
                <tr key={order.id} className="border-b border-ink-900/5 last:border-0">
                  <td className="p-3"><a href={`/commandes/${order.id}`} className="font-medium hover:underline">{order.numero_commande}</a></td>
                  <td className="p-3">{order.client_nom}</td>
                  <td className="p-3"><StatutBadge statut={order.statut} /></td>
                </tr>
              ))}
              {commandesJour.length === 0 && (
                <tr><td colSpan={3} className="p-6 text-center text-ink-900/40">Aucune commande créée aujourd'hui.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Dernières commandes</h2>
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
                <th className="p-3">Numéro</th>
                <th className="p-3">Client</th>
                <th className="p-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {dernieresCommandes.map((order) => (
                <tr key={order.id} className="border-b border-ink-900/5 last:border-0">
                  <td className="p-3"><a href={`/commandes/${order.id}`} className="hover:underline">{order.numero_commande}</a></td>
                  <td className="p-3">{order.client_nom}</td>
                  <td className="p-3"><StatutBadge statut={order.statut} /></td>
                </tr>
              ))}
              {dernieresCommandes.length === 0 && (
                <tr><td colSpan={3} className="p-6 text-center text-ink-900/40">Aucune commande pour l'instant.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
