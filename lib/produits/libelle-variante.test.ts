import { describe, it, expect } from "vitest";
import { libelleVariante, libelleArticle, estVarianteStandard } from "./libelle-variante";

describe("libelleVariante", () => {
  it("préfère le nom personnalisé de la variante", () => {
    expect(libelleVariante({ nom: "Édition limitée", couleur: "Rouge", taille: "L" })).toBe("Édition limitée");
  });

  it("retombe sur couleur / taille sans nom personnalisé", () => {
    expect(libelleVariante({ nom: null, couleur: "Rouge", taille: "L" })).toBe("Rouge / L");
  });

  it("gère une seule dimension (couleur seule)", () => {
    expect(libelleVariante({ couleur: "Bleu" })).toBe("Bleu");
  });

  it("retourne Standard quand rien n'est renseigné", () => {
    expect(libelleVariante({})).toBe("Standard");
  });
});

describe("libelleArticle", () => {
  it("combine produit et variante", () => {
    expect(libelleArticle("Tapis", { couleur: "Rouge" })).toBe("Tapis — Rouge");
  });

  it("affiche juste le produit quand il n'y a pas de variante", () => {
    expect(libelleArticle("Tapis", null)).toBe("Tapis");
    expect(libelleArticle("Tapis")).toBe("Tapis");
  });

  it("tolère un nom de produit manquant", () => {
    expect(libelleArticle(undefined, { couleur: "Rouge" })).toBe("Produit — Rouge");
  });
});

describe("variante Standard (produit sans variantes, stock suivi)", () => {
  it("n'affiche que le nom du produit", () => {
    expect(libelleArticle("Étendoir", { nom: null, couleur: null, taille: null })).toBe("Étendoir");
  });
  it("est reconnue seulement sans nom, couleur ni taille", () => {
    expect(estVarianteStandard({ nom: null, couleur: null, taille: null })).toBe(true);
    expect(estVarianteStandard({ nom: null, couleur: "Noir", taille: null })).toBe(false);
  });
});
