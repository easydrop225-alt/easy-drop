/**
 * Squelette de chargement générique — affiché instantanément par Next.js
 * (via loading.tsx) pendant qu'une page récupère ses données, au lieu de
 * laisser l'écran précédent figé sans aucun retour visuel.
 */
export function PageSkeleton({ cartes = 3 }: { cartes?: number }) {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-7 w-48 rounded-lg bg-beige-100" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-beige-100" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: cartes }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-beige-100" />
        ))}
      </div>
    </div>
  );
}

/** Version compacte, pour les pages plus simples (formulaires, détails). */
export function PageSkeletonSimple() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-7 w-40 rounded-lg bg-beige-100" />
      <div className="h-40 rounded-2xl bg-beige-100" />
      <div className="h-40 rounded-2xl bg-beige-100" />
    </div>
  );
}
