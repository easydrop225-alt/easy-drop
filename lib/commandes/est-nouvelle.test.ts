import { describe, it, expect } from "vitest";
import { estNouvelle } from "./est-nouvelle";

describe("estNouvelle", () => {
  const jour = "2026-10-10";
  it("compte les commandes en confirmation", () => {
    expect(estNouvelle({ statut: "confirmation" }, jour)).toBe(true);
  });
  it("compte une relance le jour de la relance", () => {
    expect(estNouvelle({ statut: "relance", date_relance: "2026-10-10" }, jour)).toBe(true);
  });
  it("compte une relance dont la date est passée (pas encore imprimée)", () => {
    expect(estNouvelle({ statut: "relance", date_relance: "2026-10-08" }, jour)).toBe(true);
  });
  it("ne compte pas une relance prévue plus tard", () => {
    expect(estNouvelle({ statut: "relance", date_relance: "2026-10-12" }, jour)).toBe(false);
  });
  it("ne compte pas une commande en livraison", () => {
    expect(estNouvelle({ statut: "livraison", date_relance: "2026-10-10" }, jour)).toBe(false);
  });
});
