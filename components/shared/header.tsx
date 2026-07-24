import Link from "next/link";

const NAV_COMMERCIAL = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/commandes", label: "Mes commandes" },
  { href: "/gains", label: "Mes gains" },
  { href: "/profil", label: "Profil" },
];

export function HeaderCommercial() {
  return (
    <header className="border-b border-ink-900/5 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="text-lg font-semibold">Easy Drop</Link>
        <nav className="hidden gap-6 text-sm md:flex">
          {NAV_COMMERCIAL.map((item) => (
            <Link key={item.href} href={item.href} className="text-ink-900/70 hover:text-ink-900">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

const NAV_ADMIN = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/produits", label: "Produits" },
  { href: "/admin/stocks", label: "Stocks" },
  { href: "/admin/commandes", label: "Commandes" },
  { href: "/admin/commerciaux", label: "Commerciaux" },
  { href: "/admin/paiements", label: "Paiements" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/parametres", label: "Paramètres" },
];

export function HeaderAdmin() {
  return (
    <header className="border-b border-ink-900/5 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/admin/dashboard" className="text-lg font-semibold">Easy Drop — Admin</Link>
        <nav className="hidden flex-wrap gap-4 text-sm lg:flex">
          {NAV_ADMIN.map((item) => (
            <Link key={item.href} href={item.href} className="text-ink-900/70 hover:text-ink-900">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
