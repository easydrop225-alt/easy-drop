import { Card } from "@/components/ui/card";

export default function AProposPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">À propos d'Easy Drop</h1>

      <Card className="space-y-2">
        <h2 className="font-medium">Qu'est-ce qu'Easy Drop ?</h2>
        <p className="text-sm text-ink-900/70">
          Easy Drop est une plateforme qui permet à toute personne de vendre des produits sans acheter de stock.
          Tu choisis les produits du catalogue, tu trouves des clients, puis Easy Drop s'occupe de la préparation
          et de la livraison. Tu gagnes une commission sur chaque vente.
        </p>
      </Card>

      <Card className="space-y-2">
        <h2 className="font-medium">Comment ça fonctionne ?</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-900/70">
          <li>Inscription</li>
          <li>Consultation du catalogue</li>
          <li>Partage des produits</li>
          <li>Réception des commandes</li>
          <li>Validation</li>
          <li>Préparation</li>
          <li>Livraison</li>
          <li>Paiement de tes bénéfices</li>
        </ol>
      </Card>

      <Card className="space-y-2">
        <h2 className="font-medium">Les principaux onglets</h2>
        <ul className="space-y-1.5 text-sm text-ink-900/70">
          <li><strong>Dashboard</strong> — Suis toutes tes performances.</li>
          <li><strong>Catalogue</strong> — Découvre tous les produits disponibles.</li>
          <li><strong>Commandes</strong> — Consulte tes commandes en temps réel.</li>
          <li><strong>Mes gains</strong> — Retrouve tous tes bénéfices et leur historique.</li>
          <li><strong>Parrainage</strong> — Invite de nouveaux commerciaux et gagne des bonus supplémentaires.</li>
          <li><strong>Profil</strong> — Modifie tes informations personnelles.</li>
        </ul>
      </Card>

      <Card className="space-y-2">
        <h2 className="font-medium">Règles du Programme de Parrainage</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink-900/70">
          <li>Un filleul ne peut avoir qu'un seul parrain.</li>
          <li>Le lien de parrainage est définitif.</li>
          <li>Seules les ventes effectivement livrées génèrent des points.</li>
          <li>Les points sont calculés automatiquement.</li>
          <li>Les gains sont débloqués chaque 1er du mois pour le mois précédent.</li>
          <li>Les bonus de parrainage sont financés par Easy Drop et ne réduisent jamais la commission du vendeur ayant réalisé la vente.</li>
          <li>Toute tentative de fraude (création de faux comptes, auto-parrainage, manipulation des ventes, etc.) entraîne l'annulation des bonus et peut conduire à la suspension du compte.</li>
        </ul>
      </Card>
    </div>
  );
}
