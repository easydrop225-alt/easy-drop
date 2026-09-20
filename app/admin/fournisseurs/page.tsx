import { listerFournisseurs } from "../fournisseurs-actions";
import { CreerFournisseurForm } from "./creer-fournisseur-form";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Fournisseurs" };

export default async function AdminFournisseursPage() {
  const fournisseurs = await listerFournisseurs();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Fournisseurs externes</h1>
      <p className="mb-4 text-sm text-ink-900/60">
        Un fournisseur externe ne voit que ses propres produits et les commandes qui les contiennent — jamais les autres commerciaux, produits ou paramètres.
      </p>
      <CreerFournisseurForm fournisseurs={fournisseurs} />
    </div>
  );
}
