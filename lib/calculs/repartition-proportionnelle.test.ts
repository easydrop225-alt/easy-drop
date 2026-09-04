import { describe, it, expect } from "vitest";
import { repartirProportionnellement } from "./repartition-proportionnelle";

describe("repartirProportionnellement", () => {
  it("ne change rien si le delta est nul", () => {
    expect(repartirProportionnellement([{ id: "a", montant: 5000 }], 0)).toEqual([
      { id: "a", nouveauMontant: 5000 },
    ]);
  });

  it("applique tout le delta à la seule entrée s'il n'y en a qu'une", () => {
    expect(repartirProportionnellement([{ id: "a", montant: 5000 }], -500)).toEqual([
      { id: "a", nouveauMontant: 4500 },
    ]);
  });

  it("gère un delta positif sur une seule entrée", () => {
    expect(repartirProportionnellement([{ id: "a", montant: 5000 }], 300)).toEqual([
      { id: "a", nouveauMontant: 5300 },
    ]);
  });

  it("répartit au prorata sur plusieurs entrées et la somme finale est exacte", () => {
    const resultat = repartirProportionnellement(
      [
        { id: "a", montant: 3000 },
        { id: "b", montant: 4000 },
      ],
      -700
    );
    // a pèse 3000/7000, b pèse 4000/7000
    expect(resultat).toEqual([
      { id: "a", nouveauMontant: 2700 },
      { id: "b", nouveauMontant: 3600 },
    ]);
    const sommeFinale = resultat.reduce((acc, r) => acc + r.nouveauMontant, 0);
    expect(sommeFinale).toBe(3000 + 4000 - 700);
  });

  it("la dernière entrée absorbe le reliquat d'arrondi", () => {
    const resultat = repartirProportionnellement(
      [
        { id: "a", montant: 1000 },
        { id: "b", montant: 1000 },
        { id: "c", montant: 1000 },
      ],
      100
    );
    const sommeFinale = resultat.reduce((acc, r) => acc + r.nouveauMontant, 0);
    expect(sommeFinale).toBe(3100);
  });

  it("répartit également si la somme actuelle est nulle (évite une division par zéro)", () => {
    const resultat = repartirProportionnellement(
      [
        { id: "a", montant: 0 },
        { id: "b", montant: 0 },
      ],
      200
    );
    const sommeFinale = resultat.reduce((acc, r) => acc + r.nouveauMontant, 0);
    expect(sommeFinale).toBe(200);
  });

  it("retourne un tableau vide si aucune entrée n'est fournie", () => {
    expect(repartirProportionnellement([], 500)).toEqual([]);
  });
});
