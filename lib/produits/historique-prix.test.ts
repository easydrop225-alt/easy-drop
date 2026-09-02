import { describe, it, expect } from "vitest";
import { champsPrixModifies } from "./historique-prix";

const base = { prix_fournisseur: 6000, prix_min_conseille: 8000, prix_max_conseille: 10000 };

describe("champsPrixModifies", () => {
  it("ne retourne rien si aucun prix n'a changé", () => {
    expect(champsPrixModifies(base, { ...base })).toEqual([]);
  });

  it("détecte un changement du prix fournisseur uniquement", () => {
    expect(champsPrixModifies(base, { ...base, prix_fournisseur: 6500 })).toEqual([
      { champ: "prix_fournisseur", ancienne_valeur: 6000, nouvelle_valeur: 6500 },
    ]);
  });

  it("détecte plusieurs champs modifiés en même temps", () => {
    const nouveau = { ...base, prix_min_conseille: 8500, prix_max_conseille: 11000 };
    expect(champsPrixModifies(base, nouveau)).toEqual([
      { champ: "prix_min_conseille", ancienne_valeur: 8000, nouvelle_valeur: 8500 },
      { champ: "prix_max_conseille", ancienne_valeur: 10000, nouvelle_valeur: 11000 },
    ]);
  });

  it("détecte le passage d'une valeur définie à null", () => {
    expect(champsPrixModifies(base, { ...base, prix_min_conseille: null })).toEqual([
      { champ: "prix_min_conseille", ancienne_valeur: 8000, nouvelle_valeur: null },
    ]);
  });

  it("détecte le passage de null à une valeur définie", () => {
    const ancien = { ...base, prix_max_conseille: null };
    expect(champsPrixModifies(ancien, base)).toEqual([
      { champ: "prix_max_conseille", ancienne_valeur: null, nouvelle_valeur: 10000 },
    ]);
  });

  it("ne considère pas null === null comme un changement", () => {
    const sansMax = { ...base, prix_max_conseille: null };
    expect(champsPrixModifies(sansMax, { ...sansMax })).toEqual([]);
  });

  it("ignore les écarts de type string/number représentant la même valeur (numeric Postgres)", () => {
    expect(champsPrixModifies(base, { ...base, prix_fournisseur: Number("6000") })).toEqual([]);
  });
});
