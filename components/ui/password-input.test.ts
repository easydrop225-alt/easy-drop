import { describe, it, expect } from "vitest";
import { motDePasseValide } from "./password-input";

describe("motDePasseValide", () => {
  it("refuse un mot de passe trop court", () => {
    expect(motDePasseValide("Ab1!")).toBe(false);
  });

  it("refuse sans majuscule", () => {
    expect(motDePasseValide("abcde1!")).toBe(false);
  });

  it("refuse sans minuscule", () => {
    expect(motDePasseValide("ABCDE1!")).toBe(false);
  });

  it("refuse sans chiffre", () => {
    expect(motDePasseValide("Abcdef!")).toBe(false);
  });

  it("refuse sans symbole", () => {
    expect(motDePasseValide("Abcdef1")).toBe(false);
  });

  it("accepte un mot de passe valide de 6 caractères", () => {
    expect(motDePasseValide("Ab1c!d")).toBe(true);
  });

  it("accepte un mot de passe plus long", () => {
    expect(motDePasseValide("MotDePasse123!")).toBe(true);
  });
});
