import { describe, it, expect } from "vitest";
import { calculDateLivraisonPrevue, fourchetteFraisParDefaut, repartirCorrectionLivraison } from "./calcul-livraison";

describe("calculDateLivraisonPrevue", () => {
  it("programme le lendemain pour une commande passée à 10h", () => {
    const now = new Date(2026, 0, 15, 10, 0);
    const { dateLivraison, eligibleLendemain } = calculDateLivraisonPrevue(now);
    expect(eligibleLendemain).toBe(true);
    expect(dateLivraison.getDate()).toBe(16);
  });

  it("programme le lendemain pour une commande passée à 23h59", () => {
    const now = new Date(2026, 0, 15, 23, 59);
    const { dateLivraison, eligibleLendemain } = calculDateLivraisonPrevue(now);
    expect(eligibleLendemain).toBe(true);
    expect(dateLivraison.getDate()).toBe(16);
  });

  it("ne décale pas la date pour une commande passée avant 10h", () => {
    const now = new Date(2026, 0, 15, 9, 30);
    const { dateLivraison, eligibleLendemain } = calculDateLivraisonPrevue(now);
    expect(eligibleLendemain).toBe(false);
    expect(dateLivraison.getDate()).toBe(15);
  });
});

describe("fourchetteFraisParDefaut", () => {
  it("retourne la fourchette Abidjan", () => {
    expect(fourchetteFraisParDefaut("abidjan")).toEqual({ min: 1500, max: 2000 });
  });

  it("retourne la fourchette hors Abidjan", () => {
    expect(fourchetteFraisParDefaut("hors_abidjan")).toEqual({ min: 2500, max: 4000 });
  });
});

describe("repartirCorrectionLivraison", () => {
  it("exemple de l'énoncé : livraison 1500→2000 (+500) sur 1 pièce à 5000 devient 4500", () => {
    const resultat = repartirCorrectionLivraison([{ quantite: 1, prixVenteUnitaire: 5000 }], 1500, 2000);
    expect(resultat).toEqual([{ prixVenteUnitaire: 4500 }]);
  });

  it("répartit la baisse au prorata des quantités sur plusieurs lignes", () => {
    const lignes = [
      { quantite: 2, prixVenteUnitaire: 3000 },
      { quantite: 3, prixVenteUnitaire: 2000 },
    ];
    // +500 de livraison / 5 pièces au total = -100 par pièce sur chaque ligne
    const resultat = repartirCorrectionLivraison(lignes, 1500, 2000);
    expect(resultat).toEqual([{ prixVenteUnitaire: 2900 }, { prixVenteUnitaire: 1900 }]);
  });

  it("augmente le prix de vente si la livraison baisse", () => {
    const resultat = repartirCorrectionLivraison([{ quantite: 1, prixVenteUnitaire: 4500 }], 2000, 1500);
    expect(resultat).toEqual([{ prixVenteUnitaire: 5000 }]);
  });

  it("ne change rien si le prix de livraison est identique", () => {
    const resultat = repartirCorrectionLivraison([{ quantite: 2, prixVenteUnitaire: 3000 }], 1500, 1500);
    expect(resultat).toEqual([{ prixVenteUnitaire: 3000 }]);
  });

  it("retourne null si la correction ferait passer un prix de vente sous 0", () => {
    const resultat = repartirCorrectionLivraison([{ quantite: 1, prixVenteUnitaire: 300 }], 1500, 5000);
    expect(resultat).toBeNull();
  });

  it("le prix total (vente + livraison) reste constant après compensation", () => {
    const lignes = [{ quantite: 1, prixVenteUnitaire: 5000 }];
    const totalAvant = lignes[0]!.prixVenteUnitaire + 1500;
    const resultat = repartirCorrectionLivraison(lignes, 1500, 2000)!;
    const totalApres = resultat[0]!.prixVenteUnitaire + 2000;
    expect(totalApres).toBe(totalAvant);
  });
});
