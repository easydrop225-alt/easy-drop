"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Plus, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemDef {
  href: string;
  label: string;
  icon: typeof Home;
}

// Barre simplifiée à 5 onglets (Accueil / Catalogue / + / Commandes /
// Profil) — le Dashboard détaillé reste accessible depuis un lien sur
// Accueil, et Mes gains depuis Accueil et Profil, pour ne pas surcharger
// la barre du bas sur petit écran.
const ITEM_ACCUEIL: NavItemDef = { href: "/accueil", label: "Accueil", icon: Home };
const ITEM_CATALOGUE: NavItemDef = { href: "/catalogue", label: "Catalogue", icon: ShoppingBag };
const ITEM_COMMANDES: NavItemDef = { href: "/commandes", label: "Commandes", icon: ClipboardList };
const ITEM_PROFIL: NavItemDef = { href: "/profil", label: "Profil", icon: User };

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNavCommercial() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-ink-900/5 bg-surface px-2 py-2 md:hidden">
      <NavItem item={ITEM_ACCUEIL} actif={isActive(pathname, ITEM_ACCUEIL.href)} />
      <NavItem item={ITEM_CATALOGUE} actif={isActive(pathname, ITEM_CATALOGUE.href)} />

      <Link
        href="/commandes/nouvelle"
        className="-mt-6 flex flex-col items-center gap-0.5"
        aria-label="Nouvelle commande"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-terracotta-500 text-white shadow-lg ring-4 ring-beige-50">
          <Plus size={26} />
        </span>
      </Link>

      <NavItem item={ITEM_COMMANDES} actif={isActive(pathname, ITEM_COMMANDES.href)} />
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
        "flex flex-col items-center gap-1 px-2 py-1 text-[11px] font-medium leading-tight",
        actif ? "text-terracotta-600" : "text-ink-900/50"
      )}
    >
      <Icon size={22} />
      {item.label}
    </Link>
  );
}
