import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { CategoryRow } from "@/components/produits/category-row";
import { formatFCFA } from "@/lib/utils";
import { ShoppingBag, ClipboardList, Wallet, Headset } from "lucide-react";
import type { Category, Product, Media, Setting } from "@/types/database";

export default async function AccueilCommercialPage() {
  const supabase = await createClient();

  const [{ data: settingsData }, { data: categoriesData }, { data: produitsActifs }] = await Promise.all([
    supabase.from("settings").select("*"),
    supabase.from("categories").select("*").eq("actif", true).order("ordre"),
    supabase.from("products").select("*").eq("actif", true),
  ]);

  const settings = (settingsData ?? []) as Setting[];
  const getSetting = (cle: string) => settings.find((s) => s.cle === cle)?.valeur;
  const accueilTexte = (getSetting("accueil_texte") as string | undefined)
    ?? "Des produits à prix revendeur, une logistique 100% prise en charge !";
  const modeVedette = (getSetting("produits_vedette_mode") as "statique" | "aleatoire" | undefined) ?? "aleatoire";
  const idsVedette = (getSetting("produits_vedette_ids") as string[] | undefined) ?? [];

  const categories = (categoriesData ?? []) as Category[];
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

  return (
    <div className="space-y-8">
      {/* Bannière d'accueil — texte modifiable par l'admin dans Paramètres. */}
      <div className="flex items-center gap-4 overflow-hidden rounded-2xl bg-ink-900 p-6 text-beige-50">
        <Image src="/icons/icon-512.png" alt="Easy Drop" width={72} height={72} className="shrink-0 rounded-2xl" />
        <p className="text-lg font-semibold leading-snug">{accueilTexte}</p>
      </div>

      {/* Accès rapides */}
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
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
