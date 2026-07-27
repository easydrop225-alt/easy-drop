"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";

const NAV_COMMERCIAL = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/commandes", label: "Mes commandes" },
  { href: "/gains", label: "Mes gains" },
  { href: "/profil", label: "Profil" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function HeaderCommercial() {
  const pathname = usePathname();
  const [menuOuvert, setMenuOuvert] = useState(false);

  return (
    <header className="border-b border-ink-900/5 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="text-lg font-semibold">Easy Drop</Link>
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
        <div className="flex items-center gap-3">
          <div className="hidden md:block"><LogoutButton /></div>
          <button
            onClick={() => setMenuOuvert(!menuOuvert)}
            className="rounded-lg p-2 hover:bg-beige-100 md:hidden"
            aria-label="Menu"
          >
            {menuOuvert ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOuvert && (
        <nav className="flex flex-col gap-1 border-t border-ink-900/5 px-6 py-3 text-sm md:hidden">
          {NAV_COMMERCIAL.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOuvert(false)}
              className={cn(
                "rounded-lg px-3 py-2 transition",
                isActive(pathname, item.href)
                  ? "bg-terracotta-500 text-white"
                  : "text-ink-900/70 hover:bg-beige-100"
              )}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-2 border-t border-ink-900/5 pt-2"><LogoutButton /></div>
        </nav>
      )}
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
    <header className="border-b border-ink-900/5 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/admin/dashboard" className="text-lg font-semibold">Easy Drop — Admin</Link>
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
