import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { InstallPrompt } from "@/components/shared/install-prompt";

export const metadata: Metadata = {
  title: { default: "Easy Drop", template: "%s · Easy Drop" },
  description: "Plateforme de dropshipping interne Easy Drop",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Easy Drop",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#C25E3F",
  // Nécessaire pour que env(safe-area-inset-bottom) reflète la vraie zone
  // sûre sur les iPhone à encoche/barre de geste — sans ça, la barre de
  // navigation du bas peut se retrouver partiellement sous la barre du
  // navigateur ou l'indicateur d'accueil iOS.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        {/*
          Applique la classe .dark AVANT l'hydratation React, directement
          pendant le chargement de la page, pour éviter un flash visible du
          mauvais thème. Priorité : préférence sauvegardée par l'utilisateur
          (bouton clair/sombre) > préférence système du téléphone/ordinateur.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem("easydrop_theme");
                var sombre = theme ? theme === "sombre" : window.matchMedia("(prefers-color-scheme: dark)").matches;
                if (sombre) document.documentElement.classList.add("dark");
              } catch (e) {}
            `,
          }}
        />
        {children}
        <Suspense fallback={null}>
          <InstallPrompt />
        </Suspense>
      </body>
    </html>
  );
}
