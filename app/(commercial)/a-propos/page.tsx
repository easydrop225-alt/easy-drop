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
          <li><strong>Profil</strong> — Modifie tes informations personnelles.</li>
        </ul>
      </Card>
    </div>
  );
}
