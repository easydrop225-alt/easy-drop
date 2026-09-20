import Link from "next/link";
import Image from "next/image";
import { LogoutButton } from "@/components/shared/logout-button";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function FournisseurLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-beige-50">
      <header className="sticky top-0 z-40 border-b border-ink-900/5 bg-surface">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/fournisseur/produits" className="flex items-center gap-2">
            <Image src="/logo-easy-drop.png" alt="Easy Drop" width={32} height={32} className="rounded-lg" />
            <span className="font-semibold">Espace fournisseur</span>
          </Link>
          <nav className="hidden items-center gap-4 text-sm font-medium sm:flex">
            <Link href="/fournisseur/produits" className="text-ink-900/70 hover:text-ink-900">Mes produits</Link>
            <Link href="/fournisseur/commandes" className="text-ink-900/70 hover:text-ink-900">Mes commandes</Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
        <div className="flex gap-4 border-t border-ink-900/5 px-4 py-2 text-sm font-medium sm:hidden">
          <Link href="/fournisseur/produits" className="text-ink-900/70 hover:text-ink-900">Mes produits</Link>
          <Link href="/fournisseur/commandes" className="text-ink-900/70 hover:text-ink-900">Mes commandes</Link>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-6">{children}</div>
    </div>
  );
}
