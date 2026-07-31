import { describe, it, expect } from "vitest";
import { calculBeneficeLigne, calculBeneficeCommande, estDansFourchette } from "./calcul-benefice";

describe("calculBeneficeLigne", () => {
  it("calcule le bénéfice pour une quantité de 1", () => {
    expect(calculBeneficeLigne(10000, 6000, 1)).toBe(4000);
  });

  it("multiplie correctement par la quantité", () => {
    expect(calculBeneficeLigne(10000, 6000, 3)).toBe(12000);
  });

  it("retourne un bénéfice négatif si le prix de vente est sous le prix fournisseur", () => {
    expect(calculBeneficeLigne(5000, 6000, 1)).toBe(-1000);
  });

  it("retourne 0 si prix de vente = prix fournisseur", () => {
    expect(calculBeneficeLigne(6000, 6000, 2)).toBe(0);
  });
});

describe("calculBeneficeCommande", () => {
  it("soustrait les frais de livraison du total des lignes", () => {
    expect(calculBeneficeCommande([4000, 2000], 1500)).toBe(4500);
  });

  it("gère une liste de lignes vide", () => {
    expect(calculBeneficeCommande([], 1500)).toBe(-1500);
  });

  it("gère des frais de livraison à 0", () => {
    expect(calculBeneficeCommande([4000], 0)).toBe(4000);
  });
});

describe("estDansFourchette", () => {
  it("retourne true si aucune fourchette n'est définie", () => {
    expect(estDansFourchette(10000, null, null)).toBe(true);
  });

  it("retourne true si le prix est dans la fourchette", () => {
    expect(estDansFourchette(8000, 7000, 9000)).toBe(true);
  });

  it("retourne false si le prix est sous la fourchette", () => {
    expect(estDansFourchette(6000, 7000, 9000)).toBe(false);
  });

  it("retourne false si le prix dépasse la fourchette", () => {
    expect(estDansFourchette(10000, 7000, 9000)).toBe(false);
  });

  it("accepte les bornes exactes (min et max inclus)", () => {
    expect(estDansFourchette(7000, 7000, 9000)).toBe(true);
    expect(estDansFourchette(9000, 7000, 9000)).toBe(true);
  });
});
