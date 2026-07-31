"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingBag, Plus, ClipboardList, Wallet, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemDef {
  href: string;
  label: string;
  icon: typeof Home;
}

const ITEM_ACCUEIL: NavItemDef = { href: "/accueil", label: "Accueil", icon: Home };
const ITEM_DASHBOARD: NavItemDef = { href: "/dashboard", label: "Dashboard", icon: LayoutGrid };
const ITEM_CATALOGUE: NavItemDef = { href: "/catalogue", label: "Catalogue", icon: ShoppingBag };
const ITEM_COMMANDES: NavItemDef = { href: "/commandes", label: "Commandes", icon: ClipboardList };
const ITEM_GAINS: NavItemDef = { href: "/gains", label: "Mes gains", icon: Wallet };
const ITEM_PROFIL: NavItemDef = { href: "/profil", label: "Profil", icon: User };

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNavCommercial() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-ink-900/5 bg-surface px-1 py-1.5 md:hidden">
      <NavItem item={ITEM_ACCUEIL} actif={isActive(pathname, ITEM_ACCUEIL.href)} />
      <NavItem item={ITEM_DASHBOARD} actif={isActive(pathname, ITEM_DASHBOARD.href)} />
      <NavItem item={ITEM_CATALOGUE} actif={isActive(pathname, ITEM_CATALOGUE.href)} />

      <Link
        href="/commandes/nouvelle"
        className="flex flex-col items-center gap-0.5"
        aria-label="Nouvelle commande"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-terracotta-500 text-white shadow-md">
          <Plus size={22} />
        </span>
      </Link>

      <NavItem item={ITEM_COMMANDES} actif={isActive(pathname, ITEM_COMMANDES.href)} />
      <NavItem item={ITEM_GAINS} actif={isActive(pathname, ITEM_GAINS.href)} />
      <NavItem item={ITEM_PROFIL} actif={isActive(pathname, ITEM_PROFIL.href)} />
    </nav>
  );
}

function NavItem({ item, actif }: { item: NavItemDef; actif: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-col items-center gap-0.5 px-1 py-1 text-[9.5px] leading-tight",
        actif ? "text-terracotta-600" : "text-ink-900/50"
      )}
    >
      <Icon size={19} />
      {item.label}
    </Link>
  );
}
