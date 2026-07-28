"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";

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
    <header className="border-b border-ink-900/5 bg-white print:hidden">
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
          <Link href="/notifications" className="relative text-ink-900/70">
            <Bell size={22} />
            {notificationsNonLues > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                {notificationsNonLues}
              </span>
            )}
          </Link>
        </div>

        <div className="hidden md:block"><LogoutButton /></div>
      </div>
    </header>
  );
}

export interface AdminNavCounts {
  commerciauxRecents: number;
  commandesNouvelles: number;
}

export function HeaderAdmin({ counts }: { counts?: AdminNavCounts }) {
  const pathname = usePathname();
  const [menuOuvert, setMenuOuvert] = useState(false);

  const NAV_ADMIN = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/produits", label: "Produits" },
    { href: "/admin/categories", label: "Catégories" },
    { href: "/admin/stocks", label: "Stocks" },
    { href: "/admin/commandes", label: "Commandes", badge: counts?.commandesNouvelles },
    { href: "/admin/commerciaux", label: "Commerciaux", badge: counts?.commerciauxRecents },
    { href: "/admin/paiements", label: "Paiements" },
    { href: "/admin/rapports", label: "Rapports" },
    { href: "/admin/notifications", label: "Notifications" },
    { href: "/admin/parametres", label: "Paramètres" },
  ];

  return (
    <header className="border-b border-ink-900/5 bg-white print:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/admin/dashboard" className="flex items-center gap-2 text-lg font-semibold">
          <Image src="/icons/icon-192.png" alt="Easy Drop" width={36} height={36} className="rounded-lg" />
          <span className="hidden sm:inline">Easy Drop — Admin</span>
        </Link>
        <nav className="hidden flex-wrap gap-1 text-sm lg:flex">
          {NAV_ADMIN.map((item) => (
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
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden lg:block"><LogoutButton /></div>
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
          {NAV_ADMIN.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOuvert(false)}
              className={cn(
                "relative rounded-lg px-3 py-2 transition",
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
          <div className="mt-2 border-t border-ink-900/5 pt-2"><LogoutButton /></div>
        </nav>
      )}
    </header>
  );
}
