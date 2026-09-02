import { Card } from "@/components/ui/card";
import { formatFCFA, formatDate } from "@/lib/utils";
import type { ProductPriceHistory, ProductVariant, Profile } from "@/types/database";

const LABEL_CHAMP: Record<ProductPriceHistory["champ"], string> = {
  prix_fournisseur: "Prix fournisseur",
  prix_min_conseille: "Prix min conseillé",
  prix_max_conseille: "Prix max conseillé",
};

type LigneHistorique = ProductPriceHistory & {
  profiles: Pick<Profile, "prenom" | "nom"> | null;
};

function labelVariante(v: ProductVariant) {
  return [v.couleur, v.taille].filter(Boolean).join(" / ") || "Variante";
}

function formatValeur(valeur: number | null) {
  return valeur === null ? "—" : formatFCFA(valeur);
}

export function HistoriquePrix({
  historique,
  variants,
}: {
  historique: LigneHistorique[];
  variants: ProductVariant[];
}) {
  if (historique.length === 0) return null;

  return (
    <Card className="space-y-3 p-0">
      <h2 className="p-4 pb-0 font-medium">Historique des modifications de prix</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
            <th className="p-3">Date</th>
            <th className="p-3">Modifié par</th>
            <th className="p-3">Champ</th>
            <th className="p-3">Ancien</th>
            <th className="p-3">Nouveau</th>
          </tr>
        </thead>
        <tbody>
          {historique.map((ligne) => {
            const variante = variants.find((v) => v.id === ligne.product_variant_id);
            return (
              <tr key={ligne.id} className="border-b border-ink-900/5 last:border-0">
                <td className="p-3 whitespace-nowrap">{formatDate(ligne.created_at)}</td>
                <td className="p-3">{ligne.profiles ? `${ligne.profiles.prenom} ${ligne.profiles.nom}` : "—"}</td>
                <td className="p-3">
                  {LABEL_CHAMP[ligne.champ]}
                  {variante && <span className="ml-1 text-xs text-ink-900/40">({labelVariante(variante)})</span>}
                </td>
                <td className="p-3">{formatValeur(ligne.ancienne_valeur)}</td>
                <td className="p-3 font-medium">{formatValeur(ligne.nouvelle_valeur)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
