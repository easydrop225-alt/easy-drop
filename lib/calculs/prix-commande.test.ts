import { describe, expect, it } from "vitest";
import { prixUnitaireDepuisTotal, repartirPartProduits } from "./prix-commande";

describe("repartirPartProduits", () => {
  it("garde les proportions entre les lignes", () => {
    const r = repartirPartProduits(
      [{ id: "a", quantite: 1, totalLigne: 10000 }, { id: "b", quantite: 2, totalLigne: 5000 }],
      12000
    );
    expect(r.map((l) => l.totalLigne)).toEqual([8000, 4000]);
  });
  it("tombe toujours exactement sur la part produits", () => {
    const r = repartirPartProduits(
      [{ id: "a", quantite: 1, totalLigne: 3333 }, { id: "b", quantite: 1, totalLigne: 3333 }, { id: "c", quantite: 1, totalLigne: 3334 }],
      10001
    );
    expect(r.reduce((s, l) => s + l.totalLigne, 0)).toBe(10001);
  });
  it("répartit selon les quantités si tous les prix sont à 0", () => {
    const r = repartirPartProduits(
      [{ id: "a", quantite: 1, totalLigne: 0 }, { id: "b", quantite: 3, totalLigne: 0 }],
      8000
    );
    expect(r.map((l) => l.totalLigne)).toEqual([2000, 6000]);
  });
});

describe("prixUnitaireDepuisTotal", () => {
  it("divise par la quantité, arrondi au centime", () => {
    expect(prixUnitaireDepuisTotal(10000, 3)).toBe(3333.33);
    expect(prixUnitaireDepuisTotal(5000, 0)).toBe(0);
  });
});
