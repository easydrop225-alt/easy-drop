"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { PaiementEnAttenteCard } from "./paiement-en-attente-card";
import { HistoriqueVersementsGroupe } from "./historique-groupe";
import type { Payment, Profile } from "@/types/database";

interface CommercialDu {
  commercial: Profile;
  montantDu: number;
  dateDebut: string;
  dateFin: string;
}

type PaymentAvecCommercial = Payment & { profiles: Pick<Profile, "nom" | "prenom" | "nom_boutique"> };

export function FiltreCommercialPaiements({
  commerciauxDus,
  payments,
}: {
  commerciauxDus: CommercialDu[];
  payments: PaymentAvecCommercial[];
}) {
  const [commercialId, setCommercialId] = useState<string>("tous");

  const optionsCommerciaux = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of commerciauxDus) map.set(c.commercial.id, `${c.commercial.prenom} ${c.commercial.nom}`);
    for (const p of payments) {
      if (!map.has(p.commercial_id)) map.set(p.commercial_id, `${p.profiles?.prenom ?? "?"} ${p.profiles?.nom ?? ""}`);
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [commerciauxDus, payments]);

  const commerciauxDusFiltres = commercialId === "tous" ? commerciauxDus : commerciauxDus.filter((c) => c.commercial.id === commercialId);
  const paymentsFiltres = commercialId === "tous" ? payments : payments.filter((p) => p.commercial_id === commercialId);

  return (
    <div className="space-y-8">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Filtrer par commercial</label>
        <select
          value={commercialId}
          onChange={(e) => setCommercialId(e.target.value)}
          className="h-10 w-full max-w-xs rounded-xl border border-ink-900/10 bg-white px-3 text-sm"
        >
          <option value="tous">Tous les commerciaux</option>
          {optionsCommerciaux.map(([id, nom]) => <option key={id} value={id}>{nom}</option>)}
        </select>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Paiements en attente</h2>
        <div className="space-y-3">
          {commerciauxDusFiltres.map((c) => (
            <PaiementEnAttenteCard
              key={c.commercial.id}
              commercial={c.commercial}
              montantDu={c.montantDu}
              dateDebut={c.dateDebut}
              dateFin={c.dateFin}
            />
          ))}
          {commerciauxDusFiltres.length === 0 && (
            <Card><p className="text-sm text-ink-900/50">Aucun versement en attente pour l'instant.</p></Card>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-1 text-lg font-medium">Historique des versements</h2>
        <p className="mb-3 text-xs text-ink-900/40">Affichage des 3 derniers mois.</p>
        <HistoriqueVersementsGroupe payments={paymentsFiltres} />
      </div>
    </div>
  );
}
