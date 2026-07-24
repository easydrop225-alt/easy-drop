"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
        <LogoutButton />
      </div>
    </header>
  );
}

export interface AdminNavCounts {
  commerciauxEnAttente: number;
  commandesNouvelles: number;
}

export function HeaderAdmin({ counts }: { counts?: AdminNavCounts }) {
  const pathname = usePathname();

  const NAV_ADMIN = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/produits", label: "Produits" },
    { href: "/admin/categories", label: "Catégories" },
    { href: "/admin/stocks", label: "Stocks" },
    { href: "/admin/commandes", label: "Commandes", badge: counts?.commandesNouvelles },
    { href: "/admin/commerciaux", label: "Commerciaux", badge: counts?.commerciauxEnAttente },
    { href: "/admin/paiements", label: "Paiements" },
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
        <LogoutButton />
      </div>
    </header>
  );
}
