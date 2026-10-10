/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Économie du quota Vercel « Image Optimization » (forfait gratuit) :
    // - les fichiers ont des noms uniques (horodatés) et ne changent jamais,
    //   donc une image optimisée peut rester en cache 31 jours au lieu
    //   d'être recalculée toutes les heures (moins de transformations, de
    //   lectures/écritures de cache, et de téléchargements depuis Supabase) ;
    // - un seul format (WebP) et une liste courte de tailles = moins de
    //   variantes différentes à générer pour une même photo, sans perte
    //   visible sur téléphone.
    minimumCacheTTL: 2678400,
    formats: ["image/webp"],
    deviceSizes: [640, 828, 1080, 1200],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    qualities: [75],
  },
};

module.exports = nextConfig;
