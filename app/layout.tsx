import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { InstallPrompt } from "@/components/shared/install-prompt";

export const metadata: Metadata = {
  title: "Easy Drop",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        {children}
        <Suspense fallback={null}>
          <InstallPrompt />
        </Suspense>
      </body>
    </html>
  );
}
