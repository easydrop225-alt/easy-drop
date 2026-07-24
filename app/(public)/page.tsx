export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">
        Easy Drop
      </h1>
      <p className="max-w-md text-ink-900/70">
        Vendez nos produits, on s&apos;occupe de la préparation et de la
        livraison. Rejoignez le réseau de commerciaux Easy Drop.
      </p>
      <div className="flex gap-4">
        <a
          href="/inscription"
          className="rounded-xl bg-terracotta-500 px-6 py-3 text-white transition hover:bg-terracotta-600"
        >
          Devenir commercial
        </a>
        <a
          href="/produits"
          className="rounded-xl border border-ink-900/10 px-6 py-3 transition hover:bg-beige-100"
        >
          Voir le catalogue
        </a>
      </div>
    </main>
  );
}
