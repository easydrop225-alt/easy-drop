import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { formatFCFA } from "@/lib/utils";
import { ShoppingBag, ClipboardList, Wallet, LayoutGrid } from "lucide-react";
import type { Product, Media, Setting, Order, OrderItem } from "@/types/database";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Accueil" };


export default async function AccueilCommercialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const debutJour = new Date(); debutJour.setHours(0, 0, 0, 0);

  const [{ data: settingsData }, { data: produitsActifs }, { data: commandesJourData }] = await Promise.all([
    supabase.from("settings").select("*"),
    supabase.from("products").select("*").eq("actif", true),
    supabase
      .from("orders")
      .select("id, statut, order_items(benefice_ligne)")
      .eq("commercial_id", user?.id ?? "")
      .gte("created_at", debutJour.toISOString()),
  ]);

  const settings = (settingsData ?? []) as Setting[];
  const getSetting = (cle: string) => settings.find((s) => s.cle === cle)?.valeur;
  const accueilTexte = (getSetting("accueil_texte") as string | undefined)
    ?? "Des produits à prix revendeur, une logistique 100% prise en charge !";
  const modeVedette = (getSetting("produits_vedette_mode") as "statique" | "aleatoire" | undefined) ?? "aleatoire";
  const idsVedette = (getSetting("produits_vedette_ids") as string[] | undefined) ?? [];

  const produits = (produitsActifs ?? []) as Product[];

  // Résumé du jour — même principe que le dashboard, mais limité à
  // aujourd'hui uniquement : un aperçu rapide, le détail complet restant
  // sur /dashboard.
  type CommandeJour = Pick<Order, "id" | "statut"> & { order_items: Pick<OrderItem, "benefice_ligne">[] };
  const commandesJour = (commandesJourData ?? []) as CommandeJour[];
  const commandesJourTotal = commandesJour.length;
  const commandesJourEnCours = commandesJour.filter((o) =>
    ["confirmation", "traitement", "livraison", "relance"].includes(o.statut)
  ).length;
  const beneficeJour = commandesJour
    .filter((o) => o.statut === "livree")
    .reduce((acc, o) => acc + o.order_items.reduce((a, i) => a + Number(i.benefice_ligne), 0), 0);

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

  return (
    <div className="space-y-8">
      {/* Bandeau d'information défilant — texte modifiable par l'admin dans Paramètres. */}
      <div className="overflow-hidden rounded-2xl bg-ink-900 py-3.5 text-beige-50">
        <div className="flex w-max animate-bandeau-defilant gap-16 whitespace-nowrap">
          <span className="text-sm font-semibold">{accueilTexte}</span>
          <span className="text-sm font-semibold">{accueilTexte}</span>
        </div>
      </div>

      {/* Accès rapides */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href="/catalogue" className="flex flex-col items-center gap-2 rounded-2xl border border-ink-900/5 bg-surface p-4 text-center hover:shadow-md">
          <ShoppingBag className="text-terracotta-500" />
          <span className="text-xs font-medium">Produits disponibles</span>
        </Link>
        <Link href="/commandes" className="flex flex-col items-center gap-2 rounded-2xl border border-ink-900/5 bg-surface p-4 text-center hover:shadow-md">
          <ClipboardList className="text-terracotta-500" />
          <span className="text-xs font-medium">Mes commandes</span>
        </Link>
        <Link href="/gains" className="flex flex-col items-center gap-2 rounded-2xl border border-ink-900/5 bg-surface p-4 text-center hover:shadow-md">
          <Wallet className="text-terracotta-500" />
          <span className="text-xs font-medium">Mes gains</span>
        </Link>
        <Link href="/dashboard" className="flex flex-col items-center gap-2 rounded-2xl border border-ink-900/5 bg-surface p-4 text-center hover:shadow-md">
          <LayoutGrid className="text-terracotta-500" />
          <span className="text-xs font-medium">Dashboard</span>
        </Link>
      </div>

      {/* Résumé du jour — aperçu rapide, extrait du dashboard (détail complet sur /dashboard). */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Résumé du jour</h2>
          <Link href="/dashboard" className="text-sm text-terracotta-600 underline">Voir le détail</Link>
        </div>
        <div className="grid grid-cols-3 gap-3 rounded-2xl bg-ink-900 p-5 text-beige-50">
          <div>
            <p className="text-xs text-beige-50/60">Commandes</p>
            <p className="text-xl font-semibold">{commandesJourTotal}</p>
          </div>
          <div>
            <p className="text-xs text-beige-50/60">En cours</p>
            <p className="text-xl font-semibold">{commandesJourEnCours}</p>
          </div>
          <div>
            <p className="text-xs text-beige-50/60">Bénéfice</p>
            <p className="text-xl font-semibold text-terracotta-400">{formatFCFA(beneficeJour)}</p>
          </div>
        </div>
      </div>

      {/* Produits populaires / vedette */}
      {produitsVedette.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Produits populaires</h2>
            <Link href="/catalogue" className="text-sm text-terracotta-600 underline">Voir tout</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {produitsVedette.map((p) => (
              <Link
                key={p.id}
                href={`/catalogue/${p.id}`}
                className="w-36 shrink-0 overflow-hidden rounded-2xl border border-ink-900/5 bg-surface transition hover:shadow-md"
              >
                <div className="relative aspect-square bg-beige-100">
                  {imageParProduit.get(p.id) ? (
                    <Image src={imageParProduit.get(p.id)!} alt={p.nom} fill sizes="144px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-ink-900/30">Photo</div>
                  )}
                </div>
                <div className="p-2">
                  <p className="truncate text-xs font-medium">{p.nom}</p>
                  <p className="text-xs text-ink-900/50">{formatFCFA(p.prix_fournisseur)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
