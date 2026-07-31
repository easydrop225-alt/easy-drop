import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-beige-50">
      <header className="border-b border-ink-900/5 bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold">Easy Drop</Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/produits" className="text-ink-900/70 hover:text-ink-900">Catalogue</Link>
            <Link href="/connexion" className="text-ink-900/70 hover:text-ink-900">Connexion</Link>
            <Link href="/inscription" className="font-medium text-terracotta-600">Devenir commercial</Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
