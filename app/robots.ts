import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://easy-drop-kappa.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/produits", "/connexion", "/inscription"],
      // Tout l'espace connecté (commercial/admin) n'a aucun intérêt à être
      // indexé — en plus d'être de toute façon inaccessible sans compte.
      disallow: [
        "/admin",
        "/accueil",
        "/dashboard",
        "/catalogue",
        "/commandes",
        "/gains",
        "/parrainage",
        "/profil",
        "/notifications",
        "/formation",
        "/onboarding",
        "/attente-validation",
        "/a-propos",
        "/api",
        "/auth",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
