import { describe, it, expect } from "vitest";
import { niveauPourVentes, prochainNiveau, calculerBonusParrainage, premierJourDuMois } from "./parrainage";

describe("niveauPourVentes", () => {
  it("retourne Débutant pour 0 vente", () => {
    expect(niveauPourVentes(0).niveau).toBe("Débutant");
  });

  it("retourne Bronze à la limite basse (6 ventes)", () => {
    expect(niveauPourVentes(6).niveau).toBe("Bronze");
  });

  it("retourne Argent pour 10 ventes", () => {
    expect(niveauPourVentes(10).niveau).toBe("Argent");
  });

  it("retourne Diamant au-delà du dernier palier", () => {
    expect(niveauPourVentes(100).niveau).toBe("Diamant");
  });

  it("reste au palier juste en dessous d'un seuil", () => {
    expect(niveauPourVentes(5).niveau).toBe("Débutant");
    expect(niveauPourVentes(8).niveau).toBe("Bronze");
  });
});

describe("prochainNiveau", () => {
  it("retourne le palier suivant quand il existe", () => {
    expect(prochainNiveau(0)?.niveau).toBe("Bronze");
  });

  it("retourne null au dernier palier (Diamant, pas de max)", () => {
    expect(prochainNiveau(30)).toBeNull();
  });
});

describe("calculerBonusParrainage", () => {
  it("calcule le montant selon le niveau des ventes personnelles", () => {
    // 10 points, niveau Argent (9-12 ventes) => valeurPoint = 80
    const resultat = calculerBonusParrainage(10, 10);
    expect(resultat.niveau).toBe("Argent");
    expect(resultat.valeurPoint).toBe(80);
    expect(resultat.montant).toBe(800);
  });

  it("retourne un montant nul si le parrain est encore Débutant", () => {
    const resultat = calculerBonusParrainage(5, 2);
    expect(resultat.montant).toBe(0);
  });

  it("retourne 0 si aucun point n'a été généré", () => {
    const resultat = calculerBonusParrainage(0, 20);
    expect(resultat.montant).toBe(0);
  });
});

describe("premierJourDuMois", () => {
  it("retourne le 1er jour du mois au format YYYY-MM-01", () => {
    expect(premierJourDuMois(new Date(2026, 6, 23))).toBe("2026-07-01");
  });

  it("fonctionne aussi pour un mois à un chiffre", () => {
    expect(premierJourDuMois(new Date(2026, 0, 5))).toBe("2026-01-01");
  });
});
