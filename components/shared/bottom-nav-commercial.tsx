"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ShoppingBag, Plus, ClipboardList, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemDef {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
}

const ITEM_DASHBOARD: NavItemDef = { href: "/dashboard", label: "Dashboard", icon: LayoutGrid };
const ITEM_CATALOGUE: NavItemDef = { href: "/catalogue", label: "Catalogue", icon: ShoppingBag };
const ITEM_COMMANDES: NavItemDef = { href: "/commandes", label: "Commandes", icon: ClipboardList };
const ITEM_GAINS: NavItemDef = { href: "/gains", label: "Mes gains", icon: Wallet };

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNavCommercial() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-ink-900/5 bg-white px-2 py-2 md:hidden">
      <NavItem item={ITEM_DASHBOARD} actif={isActive(pathname, ITEM_DASHBOARD.href)} />
      <NavItem item={ITEM_CATALOGUE} actif={isActive(pathname, ITEM_CATALOGUE.href)} />

      <Link
        href="/commandes/nouvelle"
        className="flex flex-col items-center gap-0.5"
        aria-label="Nouvelle commande"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-terracotta-500 text-white shadow-md">
          <Plus size={24} />
        </span>
      </Link>

      <NavItem item={ITEM_COMMANDES} actif={isActive(pathname, ITEM_COMMANDES.href)} />
      <NavItem item={ITEM_GAINS} actif={isActive(pathname, ITEM_GAINS.href)} />
    </nav>
  );
}

function NavItem({ item, actif }: { item: NavItemDef; actif: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-col items-center gap-0.5 px-2 py-1 text-[11px]",
        actif ? "text-terracotta-600" : "text-ink-900/50"
      )}
    >
      <Icon size={22} />
      {item.label}
    </Link>
  );
}
