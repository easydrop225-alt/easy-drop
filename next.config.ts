import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Autorise le chargement des médias produits stockés sur Supabase Storage.
        // Remplacer XXXX par l'identifiant réel du projet Supabase une fois créé.
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    // ISR / revalidation ciblée pour la vitrine publique (catalogue).
  },
};

export default nextConfig;
