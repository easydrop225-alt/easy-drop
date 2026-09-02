import { describe, it, expect } from "vitest";
import { prixFournisseurEffectif, coutFournisseurLignes } from "./prix-variante";

describe("prixFournisseurEffectif", () => {
  it("utilise le prix de la variante quand il est défini", () => {
    expect(prixFournisseurEffectif(8000, 6000)).toBe(8000);
  });

  it("retombe sur le prix du produit quand la variante n'en a pas (undefined)", () => {
    expect(prixFournisseurEffectif(undefined, 6000)).toBe(6000);
  });

  it("retombe sur le prix du produit quand la variante en a explicitement pas (null)", () => {
    expect(prixFournisseurEffectif(null, 6000)).toBe(6000);
  });

  it("accepte un prix de variante à 0 sans retomber sur le produit", () => {
    expect(prixFournisseurEffectif(0, 6000)).toBe(0);
  });
});

describe("coutFournisseurLignes", () => {
  const prixParVariante = (id: string): number | null => {
    const table: Record<string, number | null> = { "variante-xxl": 9000, "variante-standard": null };
    return table[id] ?? null;
  };

  it("additionne le coût de plusieurs lignes avec des variantes à prix différents", () => {
    const lignes = [
      { productVariantId: "variante-xxl", quantite: 2 },
      { productVariantId: "variante-standard", quantite: 3 },
    ];
    // 2 * 9000 (prix propre) + 3 * 6000 (prix par défaut du produit) = 36 000
    expect(coutFournisseurLignes(lignes, 6000, prixParVariante)).toBe(36000);
  });

  it("utilise le prix par défaut quand la ligne n'a pas de variante (productVariantId null)", () => {
    const lignes = [{ productVariantId: null, quantite: 4 }];
    expect(coutFournisseurLignes(lignes, 6000, prixParVariante)).toBe(24000);
  });

  it("retourne 0 pour une liste de lignes vide", () => {
    expect(coutFournisseurLignes([], 6000, prixParVariante)).toBe(0);
  });
});
