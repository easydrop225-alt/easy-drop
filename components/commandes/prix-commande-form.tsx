"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { modifierPrixCommandeAdmin } from "@/app/admin/commandes/actions";
import { modifierPrixMaCommande } from "@/app/(commercial)/commandes/actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatFCFA } from "@/lib/utils";
import { prixUnitaireDepuisTotal, repartirPartProduits, type LignePrix } from "@/lib/calculs/prix-commande";

export interface LigneCommandePrix {
  id: string;
  libelle: string;
  quantite: number;
  prixVenteUnitaire: number;
  prixFournisseurUnitaire: number;
}

const TARIFS_RAPIDES = [0, 1500, 2000, 2500, 3000, 3500, 4000];

/**
 * Modification des prix d'une commande déjà enregistrée.
 * - admin : prix de la livraison, quantités, prix de vente et prix total, à tout moment ;
 * - commercial : prix de vente et prix total seulement (livraison verrouillée),
 *   la page ne l'affiche que tant que la commande n'est pas en livraison.
 * Les trois montants restent liés : prix total = produits + livraison.
 * Modifier le total (ou la livraison, côté admin) répartit la part produits
 * entre les lignes au prorata de leurs prix d'avant ; modifier une ligne
 * recalcule le total.
 */
export function PrixCommandeForm({
  orderId,
  mode,
  fraisLivraison,
  lignes,
}: {
  orderId: string;
  mode: "admin" | "commercial";
  fraisLivraison: number;
  lignes: LigneCommandePrix[];
}) {
  const estAdmin = mode === "admin";
  const initiales: LignePrix[] = lignes.map((l) => ({
    id: l.id,
    quantite: l.quantite,
    totalLigne: Math.round(l.prixVenteUnitaire * l.quantite),
  }));

  const [livraison, setLivraison] = useState(fraisLivraison);
  const [valeurs, setValeurs] = useState<LignePrix[]>(initiales);
  // Poids de répartition : les prix de ligne tels que saisis en dernier
  // directement (pas ceux recalculés), pour garder les proportions stables.
  const [poids, setPoids] = useState<LignePrix[]>(initiales);
  const [total, setTotal] = useState(initiales.reduce((a, l) => a + l.totalLigne, 0) + fraisLivraison);
  // Produits retirés de la commande (admin) : exclus des calculs, supprimés à l'enregistrement.
  const [retires, setRetires] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const partProduits = total - livraison;
  const benefice = useMemo(
    () =>
      valeurs.reduce(
        (a, v, i) => (retires.has(v.id) ? a : a + v.totalLigne - (lignes[i]?.prixFournisseurUnitaire ?? 0) * v.quantite),
        0
      ),
    [valeurs, lignes, retires]
  );
  const nbActifs = valeurs.length - retires.size;

  function sommeActive(liste: LignePrix[], exclus: Set<string>) {
    return liste.reduce((a, l) => (exclus.has(l.id) ? a : a + l.totalLigne), 0);
  }

  function appliquerTotal(nouveauTotal: number, nouvelleLivraison = livraison, exclus = retires) {
    setSaved(false);
    setTotal(nouveauTotal);
    const part = nouveauTotal - nouvelleLivraison;
    if (part < 0) return;
    const reparties = repartirPartProduits(poids.filter((l) => !exclus.has(l.id)), part);
    setValeurs((actuelles) => actuelles.map((l) => reparties.find((x) => x.id === l.id) ?? l));
  }

  /** Retirer / remettre un produit : le total est recalculé avec les produits restants. */
  function basculerRetrait(id: string) {
    setSaved(false);
    const suivants = new Set(retires);
    if (suivants.has(id)) suivants.delete(id);
    else {
      if (nbActifs <= 1) return; // une commande garde au moins un produit
      suivants.add(id);
    }
    setRetires(suivants);
    setTotal(sommeActive(valeurs, suivants) + livraison);
  }

  function changerLivraison(v: number) {
    setLivraison(v);
    appliquerTotal(total, v); // le total annoncé au client ne bouge pas : la part produits s'ajuste
  }

  function changerLigne(i: number, champ: "totalLigne" | "quantite", v: number) {
    setSaved(false);
    const suivantes = valeurs.map((l, k) => {
      if (k !== i) return l;
      if (champ === "totalLigne") return { ...l, totalLigne: v };
      // nouvelle quantité : on garde le prix unitaire de la ligne
      const unitaire = l.quantite > 0 ? l.totalLigne / l.quantite : 0;
      return { ...l, quantite: v, totalLigne: Math.round(unitaire * v) };
    });
    setValeurs(suivantes);
    setPoids(suivantes);
    setTotal(sommeActive(suivantes, retires) + livraison);
  }

  function enregistrer() {
    setError(null);
    setSaved(false);
    if (partProduits < 0) {
      setError("Le prix total doit être au moins égal au prix de la livraison.");
      return;
    }
    startTransition(async () => {
      const payload = valeurs.filter((v) => !retires.has(v.id)).map((v) => ({
        itemId: v.id,
        quantite: v.quantite,
        prixVenteUnitaire: prixUnitaireDepuisTotal(v.totalLigne, v.quantite),
      }));
      const res = estAdmin
        ? await modifierPrixCommandeAdmin(orderId, { fraisLivraison: livraison, lignes: payload, lignesSupprimees: [...retires] })
        : await modifierPrixMaCommande(orderId, payload.map(({ itemId, prixVenteUnitaire }) => ({ itemId, prixVenteUnitaire })));
      if (res?.error) setError(res.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {lignes.map((l, i) =>
          retires.has(l.id) ? (
            <div key={l.id} className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-red-300 bg-red-50 p-3">
              <p className="text-sm text-red-700 line-through">{l.libelle}</p>
              <button type="button" onClick={() => basculerRetrait(l.id)} className="shrink-0 text-sm font-medium text-ink-900/70 underline">
                Remettre
              </button>
            </div>
          ) : (
          <div key={l.id} className="rounded-xl border border-ink-900/10 p-3">
            <div className="mb-2 flex items-start justify-between gap-3">
              <p className="text-sm font-medium">{l.libelle}</p>
              {estAdmin && lignes.length > 1 && (
                <button
                  type="button"
                  disabled={nbActifs <= 1}
                  onClick={() => basculerRetrait(l.id)}
                  className="shrink-0 rounded-full border border-red-300 px-3 py-1 text-xs font-medium text-red-600 disabled:opacity-40"
                  title={nbActifs <= 1 ? "Une commande doit garder au moins un produit" : undefined}
                >
                  🗑 Retirer
                </button>
              )}
            </div>
            <div className={`grid gap-3 ${estAdmin ? "grid-cols-2" : "grid-cols-1"}`}>
              {estAdmin ? (
                <div>
                  <Label htmlFor={`qte-${l.id}`}>Quantité</Label>
                  <Input
                    id={`qte-${l.id}`}
                    type="number"
                    min={1}
                    value={valeurs[i]?.quantite || ""}
                    onChange={(e) => changerLigne(i, "quantite", Math.max(1, Number(e.target.value)))}
                  />
                </div>
              ) : (
                <p className="text-xs text-ink-900/50">Quantité : {l.quantite}</p>
              )}
              <div>
                <Label htmlFor={`prix-${l.id}`}>Prix de vente du produit (FCFA)</Label>
                <Input
                  id={`prix-${l.id}`}
                  type="number"
                  min={0}
                  value={valeurs[i]?.totalLigne ?? 0}
                  onChange={(e) => changerLigne(i, "totalLigne", Math.max(0, Number(e.target.value)))}
                />
              </div>
            </div>
          </div>
          )
        )}
      </div>
      {retires.size > 0 && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {retires.size} produit{retires.size > 1 ? "s" : ""} sera retiré{retires.size > 1 ? "s" : ""} de la commande à l&apos;enregistrement
          (stock remis en rayon). Le prix total a été recalculé : ajuste-le si le client paie un autre montant.
        </p>
      )}

      <div>
        <p className="mb-2 text-sm font-medium">Livraison</p>
        {estAdmin ? (
          <>
            <div className="mb-2 grid grid-cols-4 gap-2">
              {TARIFS_RAPIDES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => changerLivraison(t)}
                  className={`rounded-xl border px-2 py-2 text-sm font-medium transition ${
                    livraison === t ? "border-terracotta-500 bg-terracotta-500 text-white" : "border-ink-900/15 bg-surface text-ink-900/80"
                  }`}
                >
                  {t === 0 ? "0 F" : `${t.toLocaleString("fr-FR")} F`}
                </button>
              ))}
            </div>
            <Input type="number" min={0} value={livraison} onChange={(e) => changerLivraison(Math.max(0, Number(e.target.value)))} />
            <p className="mt-1 text-xs text-ink-900/50">Le prix total reste le même : la différence est reprise sur le prix de vente des produits.</p>
          </>
        ) : (
          <p className="text-sm">
            {formatFCFA(livraison)} <span className="text-xs text-ink-900/50">— modifiable uniquement par l&apos;administration</span>
          </p>
        )}
      </div>

      <div>
        <Label htmlFor={`total-${orderId}`}>Prix total de la commande (prix du produit + prix de la livraison)</Label>
        <Input
          id={`total-${orderId}`}
          type="number"
          min={0}
          value={total || ""}
          onChange={(e) => appliquerTotal(Math.max(0, Number(e.target.value)))}
        />
        {partProduits < 0 ? (
          <p className="mt-1 text-xs text-red-600">Le prix total doit être au moins égal au prix de la livraison ({formatFCFA(livraison)}).</p>
        ) : (
          <p className="mt-1 text-xs text-ink-900/50">
            Modifier le total recalcule le prix de vente des produits ({formatFCFA(partProduits)} au total, réparti entre eux).
          </p>
        )}
      </div>

      <div className="flex items-center justify-between rounded-xl bg-beige-100 px-3 py-2 text-sm">
        <span className="text-ink-900/60">Bénéfice du commercial après modification</span>
        <span className="font-semibold text-terracotta-600">{formatFCFA(benefice)}</span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <Button size="sm" disabled={pending || partProduits < 0} onClick={enregistrer}>
          {pending ? "Enregistrement..." : "Enregistrer les prix"}
        </Button>
        {saved && <span className="text-sm text-emerald-600">Enregistré ✓</span>}
      </div>
    </div>
  );
}
