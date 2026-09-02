import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://easy-drop-kappa.vercel.app";

/**
 * Sitemap de la vitrine publique uniquement — l'espace connecté
 * (commercial/admin) n'a rien à faire dans un moteur de recherche (voir
 * app/robots.ts). Utile pour que le catalogue, pensé comme outil de
 * recrutement de commerciaux, soit correctement découvert par Google.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("products_public").select("slug, created_at"),
    supabase.from("categories").select("slug").eq("actif", true),
  ]);

  const pagesStatiques: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/produits`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/inscription`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/connexion`, changeFrequency: "monthly", priority: 0.3 },
  ];

  const pagesCategories: MetadataRoute.Sitemap = (categories ?? []).map((c) => ({
    url: `${SITE_URL}/produits/categorie/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const pagesProduits: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${SITE_URL}/produits/${p.slug}`,
    lastModified: p.created_at ?? undefined,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...pagesStatiques, ...pagesCategories, ...pagesProduits];
}
