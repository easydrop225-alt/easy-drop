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

// Clé de stockage du brouillon local. Un seul brouillon à la fois (pas de
// clé par produit) : c'est volontaire, une seule commande en cours de
// saisie à protéger contre une coupure réseau.
const CLE_BROUILLON = "easydrop_brouillon_commande";

interface Brouillon {
  productId: string;
  quantitesParVariante: Record<string, number>;
  prixTotalVente: number;
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
}: {
  products: Product[];
  variants: VariantAvecStock[];
  produitPreselectionne?: string;
  imageParVariante?: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(creerCommande, undefined as { error?: string } | undefined);
  const formRef = useRef<HTMLFormElement>(null);

  const [productId, setProductId] = useState(produitPreselectionne ?? products[0]?.id ?? "");
  // Quantité choisie par variante (clé = id de la variante), ou quantité
  // unique si le produit n'a aucune variante (clé "sans_variante").
  const [quantitesParVariante, setQuantitesParVariante] = useState<Record<string, number>>({});
  const [prixTotalVente, setPrixTotalVente] = useState(0);
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
      setProductId(b.productId || produitPreselectionne || products[0]?.id || "");
      setQuantitesParVariante(b.quantitesParVariante ?? {});
      setPrixTotalVente(b.prixTotalVente ?? 0);
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
      productId,
      quantitesParVariante,
      prixTotalVente,
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
  }, [
    productId, quantitesParVariante, prixTotalVente, zone, commune, prixLivraison,
    livraisonModifieeManuellement, clientNom, clientTelephone, clientAdresse,
    observation, gare, villeExpedition,
  ]);

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
    // En ligne : la commande part normalement, on peut nettoyer le brouillon
    // (en cas d'erreur de validation, le formulaire reste rempli à l'écran
    // de toute façon grâce aux champs contrôlés ci-dessus).
    effacerBrouillon();
  }

  const produit = useMemo(() => products.find((p) => p.id === productId), [products, productId]);
  const variantesDuProduit = useMemo(() => variants.filter((v) => v.product_id === productId), [variants, productId]);

  function setQuantite(cle: string, valeur: number) {
    setQuantitesParVariante((s) => ({ ...s, [cle]: Math.max(0, valeur) }));
  }

  const lignesSelectionnees = useMemo(() => {
    if (variantesDuProduit.length > 0) {
      return variantesDuProduit
        .filter((v) => (quantitesParVariante[v.id] ?? 0) > 0)
        .map((v) => ({ productVariantId: v.id, quantite: quantitesParVariante[v.id] ?? 0 }));
    }
    const q = quantitesParVariante["sans_variante"] ?? 0;
    return q > 0 ? [{ productVariantId: null, quantite: q }] : [];
  }, [variantesDuProduit, quantitesParVariante]);

  const quantiteTotale = lignesSelectionnees.reduce((a, l) => a + l.quantite, 0);
  const prixTotal = prixTotalVente + prixLivraison;
  const prixVenteUnitaireMoyen = quantiteTotale > 0 ? prixTotalVente / quantiteTotale : 0;
  // Bénéfice = Prix total - Prix livraison - Prix fournisseur = Prix de vente - Prix fournisseur.
  const benefice = produit ? prixTotalVente - quantiteTotale * produit.prix_fournisseur : 0;
  const horsFourchette =
    produit && produit.prix_min_conseille != null && produit.prix_max_conseille != null && quantiteTotale > 0
      ? prixVenteUnitaireMoyen < produit.prix_min_conseille || prixVenteUnitaireMoyen > produit.prix_max_conseille
      : false;

  // Dès que la commune saisie correspond exactement à une commune connue
  // (via la liste déroulante/autocomplétion), le prix de la livraison se
  // met à jour automatiquement selon son tarif.
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
      <input type="hidden" name="lignesJson" value={JSON.stringify(lignesSelectionnees)} />
      <input type="hidden" name="prixTotalVente" value={prixTotalVente} />
      <input type="hidden" name="productId" value={productId} />
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
        <h2 className="mb-4 font-medium">Produit</h2>
        <div className="space-y-3">
          <div>
            <Label htmlFor="productIdSelect">Produit</Label>
            <select
              id="productIdSelect"
              value={productId}
              onChange={(e) => { setProductId(e.target.value); setQuantitesParVariante({}); }}
              className="h-10 w-full rounded-xl border border-ink-900/10 bg-surface px-3 text-sm"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.nom} — {formatFCFA(p.prix_fournisseur)}</option>
              ))}
            </select>
          </div>

          {variantesDuProduit.length > 0 ? (
            <div className="space-y-2">
              <Label>Variantes commandées (quantité par couleur/taille)</Label>
              <p className="text-xs text-ink-900/50">
                Tu peux commander plusieurs variantes différentes dans la même commande : indique une quantité pour chacune de celles souhaitées.
              </p>
              <div className="divide-y divide-ink-900/5 rounded-xl border border-ink-900/10">
                {variantesDuProduit.map((v) => {
                  const stock = v.inventory?.[0]?.quantite_disponible ?? 0;
                  const label = [v.couleur, v.taille].filter(Boolean).join(" / ") || "Standard";
                  const quantite = quantitesParVariante[v.id] ?? 0;
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
                        value={quantite}
                        disabled={stock <= 0}
                        onChange={(e) => setQuantite(v.id, Number(e.target.value))}
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
                value={quantitesParVariante["sans_variante"] ?? 0}
                onChange={(e) => setQuantite("sans_variante", Number(e.target.value))}
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="prixTotalVenteInput">Prix total de la commande (FCFA, sans la livraison)</Label>
            <Input
              id="prixTotalVenteInput"
              type="number"
              min={0}
              value={prixTotalVente}
              onChange={(e) => setPrixTotalVente(Number(e.target.value))}
              required
            />
            <p className="mt-1 text-xs text-ink-900/50">
              Indique le prix total que le client paie pour l'ensemble des pièces/variantes de cette commande (hors livraison).
            </p>
            {quantiteTotale > 0 && prixTotalVente > 0 && (
              <div className="mt-2 rounded-xl bg-terracotta-50 p-3">
                <p className="text-xs text-terracotta-700">Bénéfice si tu valides à ce prix</p>
                <p className="text-lg font-semibold text-terracotta-600">{formatFCFA(benefice)}</p>
              </div>
            )}
          </div>

          {produit?.prix_min_conseille != null && produit?.prix_max_conseille != null && (
            <p className={`text-xs ${horsFourchette ? "text-amber-600" : "text-ink-900/50"}`}>
              Fourchette de Prix Conseillée : {formatFCFA(produit.prix_min_conseille)} – {formatFCFA(produit.prix_max_conseille)} (par pièce)
            </p>
          )}

          <div>
            <Label htmlFor="observation">Observation (précisions supplémentaires)</Label>
            <textarea
              id="observation"
              name="observation"
              rows={2}
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Ex : préférence du client, remarque particulière..."
              className="w-full rounded-xl border border-ink-900/10 p-3 text-sm"
            />
          </div>
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
              value={prixLivraison}
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
          <span className="text-ink-900/60">Nombre de pièces</span>
          <span>{quantiteTotale}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-900/60">Prix de vente</span>
          <span>{formatFCFA(prixTotalVente)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-900/60">Prix de la livraison</span>
          <span>{formatFCFA(prixLivraison)}</span>
        </div>
        <div className="flex justify-between border-t border-ink-900/10 pt-2 font-medium">
          <span>Prix total (payé par le client)</span>
          <span>{formatFCFA(prixTotal)}</span>
        </div>
        <div className="mt-3 border-t border-ink-900/10 pt-3">
          <p className="text-sm text-ink-900/60">Bénéfice estimé pour cette commande</p>
          <p className="text-2xl font-semibold text-terracotta-600">{formatFCFA(benefice)}</p>
        </div>
      </Card>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending || quantiteTotale === 0} className="w-full" size="lg">
        {pending
          ? "Création en cours..."
          : !enLigne
            ? "Enregistrer (envoi dès la reconnexion)"
            : quantiteTotale === 0
              ? "Sélectionne une quantité"
              : "Valider la commande"}
      </Button>
    </form>
  );
}
