"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { creerCommande } from "../actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fourchetteFraisParDefaut } from "@/lib/calculs/calcul-livraison";
import { tarifPourCommune } from "@/lib/data/communes-abidjan";
import { PanierCommande } from "./panier-commande";
import { RecapitulatifCommande } from "./recapitulatif-commande";
import { ModeTarificationCard } from "./mode-tarification-card";
import { AjouterProduitCard } from "./ajouter-produit-card";
import { ClientCard } from "./client-card";
import { LivraisonCard } from "./livraison-card";
import { usePanierCommande, type VariantAvecStock } from "./use-panier-commande";
import { useBrouillonCommande } from "./use-brouillon-commande";
import { useConnexionCommande } from "./use-connexion-commande";
import type { Product, ZoneLivraison } from "@/types/database";

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

  // Deux façons de fixer le prix quand plusieurs produits différents sont
  // commandés ensemble : soit un prix propre à chaque produit (par défaut),
  // soit un seul prix pour toute la commande, réparti automatiquement.
  const [modeTarification, setModeTarification] = useState<"parProduit" | "total">("parProduit");
  const [prixTotalCommande, setPrixTotalCommande] = useState(0);

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

  const panierCommande = usePanierCommande({
    products,
    variants,
    produitPreselectionne,
    imageParVariante,
    imageParProduit,
    modeTarification,
    prixTotalCommande,
    prixLivraison,
  });

  const { brouillonRestaure, effacerBrouillon } = useBrouillonCommande(
    {
      panier: panierCommande.panier,
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
    },
    {
      setPanier: panierCommande.setPanier,
      setModeTarification,
      setPrixTotalCommande,
      setZone,
      setCommune,
      setPrixLivraison,
      setLivraisonModifieeManuellement,
      setClientNom,
      setClientTelephone,
      setClientAdresse,
      setObservation,
      setGare,
      setVilleExpedition,
    },
    fourchetteFraisParDefaut("abidjan").min
  );

  const { enLigne, envoiEnAttenteReconnexion, setEnvoiEnAttenteReconnexion } = useConnexionCommande(formRef);

  function surSoumission(e: React.FormEvent<HTMLFormElement>) {
    if (!navigator.onLine) {
      e.preventDefault();
      setEnvoiEnAttenteReconnexion(true);
      return;
    }
    effacerBrouillon();
  }

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
      <input type="hidden" name="produitsJson" value={JSON.stringify(panierCommande.produitsJson)} />
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

      <ModeTarificationCard
        modeTarification={modeTarification}
        onChange={setModeTarification}
        panierNonVide={panierCommande.panier.length > 0}
      />

      {panierCommande.panier.length > 0 && (
        <Card>
          <PanierCommande lignes={panierCommande.lignesPanierAffichage} onRetirer={panierCommande.retirerDuPanier} />
        </Card>
      )}

      <AjouterProduitCard
        panierNonVide={panierCommande.panier.length > 0}
        productsDisponibles={panierCommande.productsDisponibles}
        stagingProductId={panierCommande.stagingProductId}
        onSelectionnerProduit={panierCommande.selectionnerProduit}
        stagingVariantes={panierCommande.stagingVariantes}
        stagingQuantites={panierCommande.stagingQuantites}
        onQuantiteChange={panierCommande.setStagingQuantite}
        modeTarification={modeTarification}
        stagingPrixVente={panierCommande.stagingPrixVente}
        onPrixVenteChange={panierCommande.setStagingPrixVente}
        stagingQuantiteTotale={panierCommande.stagingQuantiteTotale}
        stagingBenefice={panierCommande.stagingBenefice}
        stagingProduit={panierCommande.stagingProduit}
        stagingHorsFourchette={panierCommande.stagingHorsFourchette}
        onAjouter={panierCommande.ajouterAuPanier}
        imageParVariante={imageParVariante}
        observation={observation}
        onObservationChange={setObservation}
      />

      <ClientCard
        clientNom={clientNom}
        onClientNomChange={setClientNom}
        clientTelephone={clientTelephone}
        onClientTelephoneChange={setClientTelephone}
        commune={commune}
        onCommuneChange={handleCommuneChange}
        clientAdresse={clientAdresse}
        onClientAdresseChange={setClientAdresse}
      />

      <LivraisonCard
        zone={zone}
        onZoneChange={setZone}
        prixLivraison={prixLivraison}
        onPrixLivraisonChange={(v) => { setPrixLivraison(v); setLivraisonModifieeManuellement(true); }}
        gare={gare}
        onGareChange={setGare}
        villeExpedition={villeExpedition}
        onVilleExpeditionChange={setVilleExpedition}
      />

      <RecapitulatifCommande
        nombreProduits={panierCommande.panier.length}
        quantiteTotale={panierCommande.quantiteTotalePanier}
        modeTarification={modeTarification}
        zone={zone}
        prixLivraison={prixLivraison}
        prixTotalCommande={prixTotalCommande}
        onChangePrixTotalCommande={setPrixTotalCommande}
        prixVenteTotalPanier={panierCommande.prixVenteTotalPanier}
        prixTotalAvecLivraison={panierCommande.prixTotalAvecLivraison}
        beneficeTotalPanier={panierCommande.beneficeTotalPanier}
      />

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button
        type="submit"
        disabled={pending || panierCommande.panier.length === 0 || (modeTarification === "total" && panierCommande.prixProduitsSeuls <= 0)}
        className="w-full"
        size="lg"
      >
        {pending
          ? "Création en cours..."
          : !enLigne
            ? "Enregistrer (envoi dès la reconnexion)"
            : panierCommande.panier.length === 0
              ? "Ajoute au moins un produit"
              : modeTarification === "total" && panierCommande.prixProduitsSeuls <= 0
                ? prixTotalCommande <= 0
                  ? "Renseigne le prix total"
                  : "Le prix total doit dépasser la livraison"
                : "Valider la commande"}
      </Button>
    </form>
  );
}
