import { describe, it, expect } from "vitest";
import { calculDateLivraisonPrevue, fourchetteFraisParDefaut } from "./calcul-livraison";

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
