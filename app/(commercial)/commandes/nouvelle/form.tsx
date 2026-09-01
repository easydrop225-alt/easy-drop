"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { creerCommande } from "../actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";
import { fourchetteFraisParDefaut } from "@/lib/calculs/calcul-livraison";
import { COMMUNES_ABIDJAN, tarifPourCommune } from "@/lib/data/communes-abidjan";
import type { Product, ProductVariant, Inventory, ZoneLivraison } from "@/types/database";

type VariantAvecStock = ProductVariant & { inventory: Inventory[] };

interface LigneProduitPanier {
  productId: string;
  quantitesParVariante: Record<string, number>;
  prixVente: number;
}

// Clé de stockage du brouillon local. Un seul brouillon à la fois (pas de
// clé par produit) : c'est volontaire, une seule commande en cours de
// saisie à protéger contre une coupure réseau.
const CLE_BROUILLON = "easydrop_brouillon_commande";

interface Brouillon {
  panier: LigneProduitPanier[];
  modeTarification: "parProduit" | "total";
  prixTotalCommande: number;
  zone: ZoneLivraison;
  commune: string;
  prixLivraison: number;
  livraisonModifieeManuellement: boolean;
  clientNom: string;
  clientTelephone: string;
  clientAdresse: string;
  observation: string;
  gare: string;
  villeExpedition: string;
  enregistreLe: string;
}

export function NouvelleCommandeForm({
  products,
  variants,
  produitPreselectionne,
  imageParVariante,
  imageParProduit,
}: {
  products: Product[];
  variants: VariantAvecStock[];
  produitPreselectionne?: string;
  imageParVariante?: Record<string, string>;
  imageParProduit?: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(creerCommande, undefined as { error?: string } | undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // --- Panier : les différents produits déjà ajoutés à la commande ---
  const [panier, setPanier] = useState<LigneProduitPanier[]>([]);

  // Deux façons de fixer le prix quand plusieurs produits différents sont
  // commandés ensemble : soit un prix propre à chaque produit (par défaut),
  // soit un seul prix pour toute la commande, réparti automatiquement.
  const [modeTarification, setModeTarification] = useState<"parProduit" | "total">("parProduit");
  const [prixTotalCommande, setPrixTotalCommande] = useState(0);

  // --- Zone de saisie du produit en cours d'ajout (pas encore dans le panier) ---
  const productsDisponibles = useMemo(
    () => products.filter((p) => !panier.some((l) => l.productId === p.id)),
    [products, panier]
  );
  const [stagingProductId, setStagingProductId] = useState(produitPreselectionne ?? productsDisponibles[0]?.id ?? "");
  const [stagingQuantites, setStagingQuantites] = useState<Record<string, number>>({});
  const [stagingPrixVente, setStagingPrixVente] = useState(0);

  const [zone, setZone] = useState<ZoneLivraison>("abidjan");
  const [commune, setCommune] = useState("");
  const [prixLivraison, setPrixLivraison] = useState(fourchetteFraisParDefaut("abidjan").min);
  const [livraisonModifieeManuellement, setLivraisonModifieeManuellement] = useState(false);
  const [clientNom, setClientNom] = useState("");
  const [clientTelephone, setClientTelephone] = useState("");
  const [clientAdresse, setClientAdresse] = useState("");
  const [observation, setObservation] = useState("");
  const [gare, setGare] = useState("");
  const [villeExpedition, setVilleExpedition] = useState("");

  const [brouillonRestaure, setBrouillonRestaure] = useState(false);
  const [enLigne, setEnLigne] = useState(true);
  const [envoiEnAttenteReconnexion, setEnvoiEnAttenteReconnexion] = useState(false);

  // Restaure un éventuel brouillon sauvegardé (coupure réseau, page fermée
  // par erreur...) au premier chargement du formulaire.
  useEffect(() => {
    try {
      const brut = window.localStorage.getItem(CLE_BROUILLON);
      if (!brut) return;
      const b = JSON.parse(brut) as Brouillon;
      setPanier(b.panier ?? []);
      setModeTarification(b.modeTarification ?? "parProduit");
      setPrixTotalCommande(b.prixTotalCommande ?? 0);
      setZone(b.zone ?? "abidjan");
      setCommune(b.commune ?? "");
      setPrixLivraison(b.prixLivraison ?? fourchetteFraisParDefaut("abidjan").min);
      setLivraisonModifieeManuellement(b.livraisonModifieeManuellement ?? false);
      setClientNom(b.clientNom ?? "");
      setClientTelephone(b.clientTelephone ?? "");
      setClientAdresse(b.clientAdresse ?? "");
      setObservation(b.observation ?? "");
      setGare(b.gare ?? "");
      setVilleExpedition(b.villeExpedition ?? "");
      setBrouillonRestaure(true);
    } catch {
      // Brouillon corrompu ou stockage indisponible : on ignore simplement.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sauvegarde continue du brouillon, pour ne jamais perdre la saisie en
  // cas de coupure réseau ou de fermeture accidentelle de la page.
  useEffect(() => {
    const brouillon: Brouillon = {
      panier,
      modeTarification,
      prixTotalCommande,
      zone,
      commune,
      prixLivraison,
      livraisonModifieeManuellement,
      clientNom,
      clientTelephone,
      clientAdresse,
      observation,
      gare,
      villeExpedition,
      enregistreLe: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(CLE_BROUILLON, JSON.stringify(brouillon));
    } catch {
      // Stockage plein ou indisponible : tant pis, pas bloquant.
    }
  }, [panier, modeTarification, prixTotalCommande, zone, commune, prixLivraison, livraisonModifieeManuellement, clientNom, clientTelephone, clientAdresse, observation, gare, villeExpedition]);

  function effacerBrouillon() {
    try {
      window.localStorage.removeItem(CLE_BROUILLON);
    } catch {
      // Rien à faire si le stockage est indisponible.
    }
  }

  // Détecte la connexion réseau, et renvoie automatiquement la commande dès
  // que la connexion revient si l'envoi avait été mis en attente.
  useEffect(() => {
    setEnLigne(navigator.onLine);
    function surConnexion() {
      setEnLigne(true);
      setEnvoiEnAttenteReconnexion((enAttente) => {
        if (enAttente) formRef.current?.requestSubmit();
        return false;
      });
    }
    function surDeconnexion() {
      setEnLigne(false);
    }
    window.addEventListener("online", surConnexion);
    window.addEventListener("offline", surDeconnexion);
    return () => {
      window.removeEventListener("online", surConnexion);
      window.removeEventListener("offline", surDeconnexion);
    };
  }, []);

  function surSoumission(e: React.FormEvent<HTMLFormElement>) {
    if (!navigator.onLine) {
      e.preventDefault();
      setEnvoiEnAttenteReconnexion(true);
      return;
    }
    effacerBrouillon();
  }

  // --- Logique de la zone "ajouter un produit" ---
  const stagingProduit = useMemo(() => products.find((p) => p.id === stagingProductId), [products, stagingProductId]);
  const stagingVariantes = useMemo(
    () => variants.filter((v) => v.product_id === stagingProductId),
    [variants, stagingProductId]
  );

  function setStagingQuantite(cle: string, valeur: number) {
    setStagingQuantites((s) => ({ ...s, [cle]: Math.max(0, valeur) }));
  }

  const stagingLignes = useMemo(() => {
    if (stagingVariantes.length > 0) {
      return stagingVariantes
        .filter((v) => (stagingQuantites[v.id] ?? 0) > 0)
        .map((v) => ({ productVariantId: v.id, quantite: stagingQuantites[v.id] ?? 0 }));
    }
    const q = stagingQuantites["sans_variante"] ?? 0;
    return q > 0 ? [{ productVariantId: null as string | null, quantite: q }] : [];
  }, [stagingVariantes, stagingQuantites]);

  const stagingQuantiteTotale = stagingLignes.reduce((a, l) => a + l.quantite, 0);
  const stagingPrixUnitaireMoyen = stagingQuantiteTotale > 0 ? stagingPrixVente / stagingQuantiteTotale : 0;
  const stagingBenefice = stagingProduit ? stagingPrixVente - stagingQuantiteTotale * stagingProduit.prix_fournisseur : 0;
  const stagingHorsFourchette =
    stagingProduit && stagingProduit.prix_min_conseille != null && stagingProduit.prix_max_conseille != null && stagingQuantiteTotale > 0
      ? stagingPrixUnitaireMoyen < stagingProduit.prix_min_conseille || stagingPrixUnitaireMoyen > stagingProduit.prix_max_conseille
      : false;

  function ajouterAuPanier() {
    if (!stagingProductId || stagingLignes.length === 0) return;
    if (modeTarification === "parProduit" && stagingPrixVente <= 0) return;
    setPanier((p) => [...p, { productId: stagingProductId, quantitesParVariante: { ...stagingQuantites }, prixVente: stagingPrixVente }]);
    // Réinitialise la zone de saisie pour le prochain produit à ajouter.
    setStagingQuantites({});
    setStagingPrixVente(0);
    const prochainDisponible = products.find((p) => p.id !== stagingProductId && !panier.some((l) => l.productId === p.id));
    setStagingProductId(prochainDisponible?.id ?? "");
  }

  function retirerDuPanier(index: number) {
    setPanier((p) => p.filter((_, i) => i !== index));
  }

  // --- Calculs du panier complet ---
  function lignesPourProduit(ligne: LigneProduitPanier) {
    const variantesDuProduit = variants.filter((v) => v.product_id === ligne.productId);
    if (variantesDuProduit.length > 0) {
      return variantesDuProduit
        .filter((v) => (ligne.quantitesParVariante[v.id] ?? 0) > 0)
        .map((v) => ({ productVariantId: v.id, quantite: ligne.quantitesParVariante[v.id] ?? 0 }));
    }
    const q = ligne.quantitesParVariante["sans_variante"] ?? 0;
    return q > 0 ? [{ productVariantId: null as string | null, quantite: q }] : [];
  }

  const quantiteTotalePanierBrute = panier.reduce(
    (a, ligne) => a + lignesPourProduit(ligne).reduce((x, l) => x + l.quantite, 0),
    0
  );
  // En mode "prix total", chaque produit reçoit une part du prix total
  // proportionnelle à sa quantité (même logique qu'avant pour un seul
  // produit, désormais étendue à plusieurs produits différents). La somme
  // des parts reconstitue exactement le prix total saisi.
  const prixVenteUnitaireMoyenGlobal =
    modeTarification === "total" && quantiteTotalePanierBrute > 0 ? prixTotalCommande / quantiteTotalePanierBrute : 0;

  const produitsJson = useMemo(
    () =>
      panier.map((ligne) => {
        const lignes = lignesPourProduit(ligne);
        const qteProduit = lignes.reduce((x, l) => x + l.quantite, 0);
        const prixVente = modeTarification === "total" ? prixVenteUnitaireMoyenGlobal * qteProduit : ligne.prixVente;
        return { productId: ligne.productId, lignes, prixVente };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [panier, modeTarification, prixVenteUnitaireMoyenGlobal]
  );

  const quantiteTotalePanier = quantiteTotalePanierBrute;
  const prixVenteTotalPanier = modeTarification === "total" ? prixTotalCommande : panier.reduce((a, l) => a + l.prixVente, 0);
  const beneficeTotalPanier = panier.reduce((a, ligne) => {
    const produit = products.find((p) => p.id === ligne.productId);
    const qte = lignesPourProduit(ligne).reduce((x, l) => x + l.quantite, 0);
    const prixVente = modeTarification === "total" ? prixVenteUnitaireMoyenGlobal * qte : ligne.prixVente;
    return a + (produit ? prixVente - qte * produit.prix_fournisseur : 0);
  }, 0);
  const prixTotalAvecLivraison = prixVenteTotalPanier + prixLivraison;

  function handleCommuneChange(valeur: string) {
    setCommune(valeur);
    const tarif = tarifPourCommune(valeur);
    if (tarif != null) {
      setPrixLivraison(tarif);
      setLivraisonModifieeManuellement(false);
    }
  }

  useEffect(() => {
    if (!livraisonModifieeManuellement) {
      setPrixLivraison(fourchetteFraisParDefaut(zone).min);
    }
  }, [zone, livraisonModifieeManuellement]);

  return (
    <form ref={formRef} action={formAction} onSubmit={surSoumission} className="space-y-6">
      <input type="hidden" name="produitsJson" value={JSON.stringify(produitsJson)} />
      <input type="hidden" name="modeLivraison" value="normal" />

      {!enLigne && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          📴 Pas de connexion internet. Continue de remplir la commande normalement : rien ne sera perdu, et elle sera envoyée automatiquement dès que la connexion reviendra.
        </div>
      )}
      {envoiEnAttenteReconnexion && enLigne && (
        <div className="rounded-xl border border-terracotta-300 bg-terracotta-50 p-3 text-sm text-terracotta-700">
          Connexion rétablie — envoi de la commande en cours...
        </div>
      )}
      {brouillonRestaure && (
        <div className="rounded-xl border border-ink-900/10 bg-beige-100 p-3 text-sm text-ink-900/70">
          Une saisie en cours a été restaurée automatiquement.
        </div>
      )}

      <Card>
        <h2 className="mb-3 font-medium">Mode de tarification</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={panier.length > 0}
            onClick={() => setModeTarification("parProduit")}
            className={`rounded-xl border p-3 text-left text-sm transition ${
              modeTarification === "parProduit" ? "border-terracotta-500 bg-terracotta-50" : "border-ink-900/10"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <p className="font-medium">Prix par produit</p>
            <p className="text-xs text-ink-900/50">Un prix différent pour chaque produit ajouté.</p>
          </button>
          <button
            type="button"
            disabled={panier.length > 0}
            onClick={() => setModeTarification("total")}
            className={`rounded-xl border p-3 text-left text-sm transition ${
              modeTarification === "total" ? "border-terracotta-500 bg-terracotta-50" : "border-ink-900/10"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <p className="font-medium">Un seul prix total</p>
            <p className="text-xs text-ink-900/50">Un seul prix pour toute la commande, réparti automatiquement.</p>
          </button>
        </div>
        {panier.length > 0 && (
          <p className="mt-2 text-xs text-ink-900/40">
            Vide le panier ci-dessous pour changer de mode de tarification.
          </p>
        )}
      </Card>

      {panier.length > 0 && (
        <Card>
          <h2 className="mb-3 font-medium">Produits de cette commande ({panier.length})</h2>
          <div className="divide-y divide-ink-900/5">
            {panier.map((ligne, index) => {
              const produit = products.find((p) => p.id === ligne.productId);
              const lignesDuProduit = lignesPourProduit(ligne);
              const qte = lignesDuProduit.reduce((x, l) => x + l.quantite, 0);
              const prixVenteLigne = modeTarification === "total" ? prixVenteUnitaireMoyenGlobal * qte : ligne.prixVente;
              const benefice = produit ? prixVenteLigne - qte * produit.prix_fournisseur : 0;
              // Miniature représentative de la ligne : photo de la première
              // variante choisie si elle en a une, sinon photo générale du
              // produit — avec la quantité totale affichée en badge, comme
              // un panier d'achat classique.
              const premiereVarianteId = lignesDuProduit[0]?.productVariantId;
              const photo = (premiereVarianteId && imageParVariante?.[premiereVarianteId]) || imageParProduit?.[ligne.productId];
              return (
                <div key={`${ligne.productId}-${index}`} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0">
                      {photo ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={photo} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-beige-100 text-ink-900/30">
                          <span className="text-lg">📦</span>
                        </div>
                      )}
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta-500 px-1 text-[11px] font-semibold text-white">
                        {qte}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{produit?.nom ?? "Produit"}</p>
                      <p className="text-xs text-ink-900/50">
                        {qte} pièce{qte > 1 ? "s" : ""}
                        {modeTarification === "parProduit"
                          ? ` · ${formatFCFA(prixVenteLigne)} · bénéfice ${formatFCFA(benefice)}`
                          : prixTotalCommande > 0
                            ? ` · part du prix total : ${formatFCFA(prixVenteLigne)}`
                            : " · en attente du prix total"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => retirerDuPanier(index)}
                    className="shrink-0 text-xs text-red-600 underline"
                  >
                    Retirer
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      )}


      <Card>
        <h2 className="mb-4 font-medium">{panier.length > 0 ? "Ajouter un autre produit" : "Produit"}</h2>

        {productsDisponibles.length === 0 ? (
          <p className="text-sm text-ink-900/50">Tous les produits actifs sont déjà dans cette commande.</p>
        ) : (
          <div className="space-y-3">
            <div>
              <Label htmlFor="productIdSelect">Produit</Label>
              <select
                id="productIdSelect"
                value={stagingProductId}
                onChange={(e) => { setStagingProductId(e.target.value); setStagingQuantites({}); setStagingPrixVente(0); }}
                className="h-10 w-full rounded-xl border border-ink-900/10 bg-surface px-3 text-sm"
              >
                {productsDisponibles.map((p) => (
                  <option key={p.id} value={p.id}>{p.nom} — {formatFCFA(p.prix_fournisseur)}</option>
                ))}
              </select>
            </div>

            {stagingVariantes.length > 0 ? (
              <div className="space-y-2">
                <Label>Variantes commandées (quantité par couleur/taille)</Label>
                <div className="divide-y divide-ink-900/5 rounded-xl border border-ink-900/10">
                  {stagingVariantes.map((v) => {
                    const stock = v.inventory?.[0]?.quantite_disponible ?? 0;
                    const label = [v.couleur, v.taille].filter(Boolean).join(" / ") || "Standard";
                    const quantite = stagingQuantites[v.id] ?? 0;
                    const photo = imageParVariante?.[v.id];
                    return (
                      <div key={v.id} className="flex items-center justify-between gap-3 p-3">
                        <div className="flex items-center gap-3">
                          {photo && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={photo} alt={label} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{label}</p>
                            <p className={`text-xs ${stock > 0 ? "text-ink-900/50" : "text-red-600"}`}>
                              {stock > 0 ? `${stock} en stock` : "Rupture de stock"}
                            </p>
                          </div>
                        </div>
                        <Input
                          type="number"
                          min={0}
                          max={stock > 0 ? stock : 0}
                          value={quantite || ""}
                          disabled={stock <= 0}
                          onChange={(e) => setStagingQuantite(v.id, Number(e.target.value))}
                          className="w-20"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="quantiteSansVariante">Quantité</Label>
                <Input
                  id="quantiteSansVariante"
                  type="number"
                  min={0}
                  value={stagingQuantites["sans_variante"] || ""}
                  onChange={(e) => setStagingQuantite("sans_variante", Number(e.target.value))}
                />
              </div>
            )}

            {modeTarification === "parProduit" ? (
              <div>
                <Label htmlFor="prixVenteInput">Prix de vente pour ce produit (FCFA, sans la livraison)</Label>
                <Input
                  id="prixVenteInput"
                  type="number"
                  min={0}
                  value={stagingPrixVente || ""}
                  onChange={(e) => setStagingPrixVente(Number(e.target.value))}
                />
                {stagingQuantiteTotale > 0 && stagingPrixVente > 0 && (
                  <div className="mt-2 rounded-xl bg-terracotta-50 p-3">
                    <p className="text-xs text-terracotta-700">Bénéfice pour ce produit</p>
                    <p className="text-lg font-semibold text-terracotta-600">{formatFCFA(stagingBenefice)}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-ink-900/50">
                Prix géré plus bas, en une seule fois pour toute la commande — pas besoin de le saisir produit par produit.
              </p>
            )}

            {stagingProduit?.prix_min_conseille != null && stagingProduit?.prix_max_conseille != null && (
              <p className={`text-xs ${stagingHorsFourchette ? "text-amber-600" : "text-ink-900/50"}`}>
                Fourchette conseillée : {formatFCFA(stagingProduit.prix_min_conseille)} – {formatFCFA(stagingProduit.prix_max_conseille)} (par pièce)
              </p>
            )}

            <button
              type="button"
              disabled={stagingQuantiteTotale === 0 || (modeTarification === "parProduit" && stagingPrixVente <= 0)}
              onClick={ajouterAuPanier}
              className="w-full rounded-xl bg-green-600 py-3 text-center font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              + Ajouter ce produit à la commande
            </button>
          </div>
        )}

        <div className="mt-4">
          <Label htmlFor="observation">Observation (précisions supplémentaires)</Label>
          <textarea
            id="observation"
            name="observation"
            rows={2}
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="Ex : préférence du client, remarque particulière..."
            className="w-full rounded-xl border border-ink-900/10 bg-surface p-3 text-sm"
          />
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-medium">Client</h2>
        <div className="space-y-3">
          <div>
            <Label htmlFor="clientNom">Nom du client</Label>
            <Input id="clientNom" name="clientNom" value={clientNom} onChange={(e) => setClientNom(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="clientTelephone">Téléphone du client</Label>
            <Input id="clientTelephone" name="clientTelephone" value={clientTelephone} onChange={(e) => setClientTelephone(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="clientCommune">Commune</Label>
            <Input
              id="clientCommune"
              name="clientCommune"
              list="communes-liste"
              value={commune}
              onChange={(e) => handleCommuneChange(e.target.value)}
              placeholder="Commence à écrire pour voir les suggestions..."
              autoComplete="off"
              required
            />
            <datalist id="communes-liste">
              {COMMUNES_ABIDJAN.map((c) => (
                <option key={c.commune} value={c.commune} />
              ))}
            </datalist>
          </div>
          <div>
            <Label htmlFor="clientAdresse">Adresse complète</Label>
            <Input id="clientAdresse" name="clientAdresse" value={clientAdresse} onChange={(e) => setClientAdresse(e.target.value)} required />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-medium">Livraison</h2>
        <p className="mb-3 text-xs text-ink-900/50">
          Un seul frais de livraison pour toute la commande, quel que soit le nombre de produits différents ci-dessus.
        </p>
        <div className="space-y-3">
          <div>
            <Label htmlFor="zone">Zone</Label>
            <select id="zone" name="zone" value={zone} onChange={(e) => setZone(e.target.value as ZoneLivraison)}
              className="h-10 w-full rounded-xl border border-ink-900/10 bg-surface px-3 text-sm">
              <option value="abidjan">Abidjan (paiement à la livraison)</option>
              <option value="hors_abidjan">Hors Abidjan / Expédition (paiement avant expédition)</option>
            </select>
          </div>
          <div>
            <Label htmlFor="fraisLivraison">Prix de la livraison (FCFA)</Label>
            <Input
              id="fraisLivraison"
              name="fraisLivraison"
              type="number"
              min={0}
              value={prixLivraison || ""}
              onChange={(e) => { setPrixLivraison(Number(e.target.value)); setLivraisonModifieeManuellement(true); }}
              required
            />
            <p className="mt-1 text-xs text-ink-900/50">
              {zone === "abidjan"
                ? "Le tarif se met à jour automatiquement selon la commune choisie ci-dessus. Tu peux aussi l'ajuster manuellement."
                : `Suggestion hors Abidjan : ${formatFCFA(fourchetteFraisParDefaut(zone).min)} – ${formatFCFA(fourchetteFraisParDefaut(zone).max)}.`}
            </p>
          </div>

          {zone === "hors_abidjan" && (
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-beige-100 p-3">
              <div>
                <Label htmlFor="gare">Gare (point de dépôt)</Label>
                <Input id="gare" name="gare" value={gare} onChange={(e) => setGare(e.target.value)} placeholder="Ex : Gare UTB Yamoussoukro" />
              </div>
              <div>
                <Label htmlFor="villeExpedition">Ville de destination</Label>
                <Input id="villeExpedition" name="villeExpedition" value={villeExpedition} onChange={(e) => setVilleExpedition(e.target.value)} placeholder="Ex : Yamoussoukro" />
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="space-y-2 bg-beige-100">
        <div className="flex justify-between text-sm">
          <span className="text-ink-900/60">Produits différents</span>
          <span>{panier.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-900/60">Nombre total de pièces</span>
          <span>{quantiteTotalePanier}</span>
        </div>
        {modeTarification === "total" ? (
          <div className="py-1">
            <Label htmlFor="prixTotalCommandeInput">Prix de vente total (tous produits confondus, FCFA)</Label>
            <Input
              id="prixTotalCommandeInput"
              type="number"
              min={0}
              value={prixTotalCommande || ""}
              onChange={(e) => setPrixTotalCommande(Number(e.target.value))}
            />
            <p className="mt-1 text-xs text-ink-900/50">
              Réparti automatiquement entre les {panier.length || "..."} produit(s) au prorata des quantités.
            </p>
          </div>
        ) : (
          <div className="flex justify-between text-sm">
            <span className="text-ink-900/60">Prix de vente (tous produits)</span>
            <span>{formatFCFA(prixVenteTotalPanier)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-ink-900/60">Prix de la livraison</span>
          <span>{formatFCFA(prixLivraison)}</span>
        </div>
        <div className="flex justify-between border-t border-ink-900/10 pt-2 font-medium">
          <span>Prix total (payé par le client)</span>
          <span>{formatFCFA(prixTotalAvecLivraison)}</span>
        </div>
        <div className="mt-3 border-t border-ink-900/10 pt-3">
          <p className="text-sm text-ink-900/60">Bénéfice estimé pour cette commande</p>
          <p className="text-2xl font-semibold text-terracotta-600">{formatFCFA(beneficeTotalPanier)}</p>
        </div>
      </Card>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button
        type="submit"
        disabled={pending || panier.length === 0 || (modeTarification === "total" && prixTotalCommande <= 0)}
        className="w-full"
        size="lg"
      >
        {pending
          ? "Création en cours..."
          : !enLigne
            ? "Enregistrer (envoi dès la reconnexion)"
            : panier.length === 0
              ? "Ajoute au moins un produit"
              : modeTarification === "total" && prixTotalCommande <= 0
                ? "Renseigne le prix total"
                : "Valider la commande"}
      </Button>
    </form>
  );
}
