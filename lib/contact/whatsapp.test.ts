import { describe, expect, it } from "vitest";
import { lienWhatsApp } from "./whatsapp";

describe("lienWhatsApp", () => {
  it("garde le 0 d'un numéro local à 10 chiffres", () => {
    expect(lienWhatsApp("07 47 00 00 57")).toBe("https://wa.me/2250747000057");
  });
  it("accepte un numéro déjà au format international", () => {
    expect(lienWhatsApp("+225 0747000057")).toBe("https://wa.me/2250747000057");
    expect(lienWhatsApp("002250747000057")).toBe("https://wa.me/2250747000057");
  });
});
