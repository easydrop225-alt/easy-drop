"use client";

import { useEffect, useState } from "react";
import type { LigneProduitPanier } from "./use-panier-commande";
import type { ZoneLivraison } from "@/types/database";

// Clé de stockage du brouillon local. Un seul brouillon à la fois (pas de
// clé par produit) : c'est volontaire, une seule commande en cours de
// saisie à protéger contre une coupure réseau.
const CLE_BROUILLON = "easydrop_brouillon_commande";

export interface EtatBrouillon {
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
}

interface SettersBrouillon {
  setPanier: (v: LigneProduitPanier[]) => void;
  setModeTarification: (v: "parProduit" | "total") => void;
  setPrixTotalCommande: (v: number) => void;
  setZone: (v: ZoneLivraison) => void;
  setCommune: (v: string) => void;
  setPrixLivraison: (v: number) => void;
  setLivraisonModifieeManuellement: (v: boolean) => void;
  setClientNom: (v: string) => void;
  setClientTelephone: (v: string) => void;
  setClientAdresse: (v: string) => void;
  setObservation: (v: string) => void;
  setGare: (v: string) => void;
  setVilleExpedition: (v: string) => void;
}

/**
 * Sauvegarde continue de la saisie de commande dans localStorage, et
 * restauration automatique au premier chargement — protège contre une
 * coupure réseau ou une fermeture accidentelle de la page.
 */
export function useBrouillonCommande(
  etat: EtatBrouillon,
  setters: SettersBrouillon,
  prixLivraisonParDefaut: number
) {
  const [brouillonRestaure, setBrouillonRestaure] = useState(false);

  useEffect(() => {
    try {
      const brut = window.localStorage.getItem(CLE_BROUILLON);
      if (!brut) return;
      const b = JSON.parse(brut) as Partial<EtatBrouillon>;
      setters.setPanier(b.panier ?? []);
      setters.setModeTarification(b.modeTarification ?? "parProduit");
      setters.setPrixTotalCommande(b.prixTotalCommande ?? 0);
      setters.setZone(b.zone ?? "abidjan");
      setters.setCommune(b.commune ?? "");
      setters.setPrixLivraison(b.prixLivraison ?? prixLivraisonParDefaut);
      setters.setLivraisonModifieeManuellement(b.livraisonModifieeManuellement ?? false);
      setters.setClientNom(b.clientNom ?? "");
      setters.setClientTelephone(b.clientTelephone ?? "");
      setters.setClientAdresse(b.clientAdresse ?? "");
      setters.setObservation(b.observation ?? "");
      setters.setGare(b.gare ?? "");
      setters.setVilleExpedition(b.villeExpedition ?? "");
      setBrouillonRestaure(true);
    } catch {
      // Brouillon corrompu ou stockage indisponible : on ignore simplement.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sauvegarde continue du brouillon, pour ne jamais perdre la saisie en
  // cas de coupure réseau ou de fermeture accidentelle de la page.
  useEffect(() => {
    try {
      window.localStorage.setItem(CLE_BROUILLON, JSON.stringify({ ...etat, enregistreLe: new Date().toISOString() }));
    } catch {
      // Stockage plein ou indisponible : tant pis, pas bloquant.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    etat.panier,
    etat.modeTarification,
    etat.prixTotalCommande,
    etat.zone,
    etat.commune,
    etat.prixLivraison,
    etat.livraisonModifieeManuellement,
    etat.clientNom,
    etat.clientTelephone,
    etat.clientAdresse,
    etat.observation,
    etat.gare,
    etat.villeExpedition,
  ]);

  function effacerBrouillon() {
    try {
      window.localStorage.removeItem(CLE_BROUILLON);
    } catch {
      // Rien à faire si le stockage est indisponible.
    }
  }

  return { brouillonRestaure, effacerBrouillon };
}
