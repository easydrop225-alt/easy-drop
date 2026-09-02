"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";
import { RechercheGlobale } from "./recherche-globale";
import { ThemeToggle } from "./theme-toggle";
import { CompteSwitcher } from "./compte-switcher";

const NAV_COMMERCIAL = [
  { href: "/accueil", label: "Accueil" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/commandes", label: "Mes commandes" },
  { href: "/gains", label: "Mes gains" },
  { href: "/profil", label: "Profil" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function HeaderCommercial({ notificationsNonLues = 0 }: { notificationsNonLues?: number }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-ink-900/5 bg-surface print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/accueil" className="flex items-center gap-2 text-lg font-semibold">
          <Image src="/icons/icon-192.png" alt="Easy Drop" width={36} height={36} className="rounded-lg" />
          <span className="hidden sm:inline">Easy Drop</span>
        </Link>

        <nav className="hidden gap-1 text-sm md:flex">
          {NAV_COMMERCIAL.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-1.5 transition",
                isActive(pathname, item.href)
                  ? "bg-terracotta-500 text-white"
                  : "text-ink-900/70 hover:bg-beige-100 hover:text-ink-900"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Barre du haut simplifiée sur mobile : juste la cloche de
            notifications (le profil est accessible depuis la barre de
            navigation du bas — voir BottomNavCommercial). */}
        <div className="flex items-center gap-4 md:hidden">
          <ThemeToggle />
          <Link href="/notifications" className="relative text-ink-900/70" aria-label="Notifications">
            <Bell size={22} />
            {notificationsNonLues > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                {notificationsNonLues}
              </span>
            )}
          </Link>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

export interface AdminNavCounts {
  commerciauxRecents: number;
  commandesNouvelles: number;
}

export function HeaderAdmin({
  counts,
  comptesLies = [],
}: {
  counts?: AdminNavCounts;
  comptesLies?: { lienId: string; compteCibleId: string; label: string }[];
}) {
  const pathname = usePathname();
  const [menuOuvert, setMenuOuvert] = useState(false);

  // Regroupé par thème plutôt qu'une liste plate de 12 liens — purement
  // visuel, aucune route ni logique ne change.
  const GROUPES_NAV_ADMIN: { groupe: string; items: { href: string; label: string; badge?: number }[] }[] = [
    { groupe: "", items: [{ href: "/admin/dashboard", label: "Dashboard" }] },
    {
      groupe: "Catalogue",
      items: [
        { href: "/admin/produits", label: "Produits" },
        { href: "/admin/categories", label: "Catégories" },
        { href: "/admin/stocks", label: "Stocks" },
      ],
    },
    {
      groupe: "Ventes",
      items: [
        { href: "/admin/commandes", label: "Commandes", badge: counts?.commandesNouvelles },
        { href: "/admin/paiements", label: "Paiements" },
        { href: "/admin/rapports", label: "Rapports" },
      ],
    },
    {
      groupe: "Équipe",
      items: [
        { href: "/admin/commerciaux", label: "Commerciaux", badge: counts?.commerciauxRecents },
        { href: "/admin/formations", label: "Formations" },
        { href: "/admin/journal", label: "Journal" },
      ],
    },
    {
      groupe: "Système",
      items: [
        { href: "/admin/notifications", label: "Notifications" },
        { href: "/admin/parametres", label: "Paramètres" },
      ],
    },
  ];

  return (
    <header className="border-b border-ink-900/5 bg-surface print:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/admin/dashboard" className="flex items-center gap-2 text-lg font-semibold">
          <Image src="/icons/icon-192.png" alt="Easy Drop" width={36} height={36} className="rounded-lg" />
          <span className="hidden sm:inline">Easy Drop — Admin</span>
        </Link>
        <nav className="hidden flex-wrap items-center gap-1 text-sm lg:flex">
          {GROUPES_NAV_ADMIN.map((groupe, gi) => (
            <div key={gi} className="flex items-center gap-1">
              {gi > 0 && <span className="mx-1.5 h-5 w-px bg-ink-900/10" aria-hidden />}
              {groupe.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-lg px-3 py-1.5 transition",
                    isActive(pathname, item.href)
                      ? "bg-terracotta-500 text-white"
                      : "text-ink-900/70 hover:bg-beige-100 hover:text-ink-900"
                  )}
                >
                  {item.label}
                  {!!item.badge && item.badge > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <RechercheGlobale />
          <div className="hidden items-center gap-2 lg:flex">
            <CompteSwitcher liens={comptesLies} />
            <ThemeToggle />
            <LogoutButton />
          </div>
          <button
            onClick={() => setMenuOuvert(!menuOuvert)}
            className="rounded-lg p-2 hover:bg-beige-100 lg:hidden"
            aria-label="Menu"
          >
            {menuOuvert ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOuvert && (
        <nav className="flex flex-col gap-1 border-t border-ink-900/5 px-6 py-3 text-sm lg:hidden">
          {GROUPES_NAV_ADMIN.map((groupe, gi) => (
            <div key={gi} className={gi > 0 ? "mt-2 border-t border-ink-900/5 pt-2" : ""}>
              {groupe.groupe && (
                <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-ink-900/40">
                  {groupe.groupe}
                </p>
              )}
              {groupe.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOuvert(false)}
                  className={cn(
                    "relative flex rounded-lg px-3 py-2 transition",
                    isActive(pathname, item.href)
                      ? "bg-terracotta-500 text-white"
                      : "text-ink-900/70 hover:bg-beige-100"
                  )}
                >
                  {item.label}
                  {!!item.badge && item.badge > 0 && (
                    <span className="ml-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ))}
          <div className="mt-2 flex items-center justify-between border-t border-ink-900/5 pt-2">
            <LogoutButton />
            <div className="flex items-center gap-1">
              <CompteSwitcher liens={comptesLies} />
              <ThemeToggle />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
