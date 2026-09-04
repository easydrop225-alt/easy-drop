import { describe, it, expect, vi, afterEach } from "vitest";
import { debutSemaineCourante } from "./utils";

describe("debutSemaineCourante", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renvoie le lundi de la semaine quand on est un mercredi", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 2, 15, 30)); // mercredi 2 sept. 2026
    const debut = debutSemaineCourante();
    expect(debut.getDay()).toBe(1); // lundi
    expect(debut.getDate()).toBe(31); // lundi 31 août 2026
    expect(debut.getHours()).toBe(0);
  });

  it("renvoie le lundi précédent quand on est un dimanche (pas le lundi suivant)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 6, 10, 0)); // dimanche 6 sept. 2026
    const debut = debutSemaineCourante();
    expect(debut.getDay()).toBe(1);
    expect(debut.getDate()).toBe(31); // toujours lundi 31 août, pas 7 sept.
  });

  it("renvoie le jour même quand on est déjà lundi, à minuit", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 7, 9, 0)); // lundi 7 sept. 2026
    const debut = debutSemaineCourante();
    expect(debut.getDate()).toBe(7);
    expect(debut.getHours()).toBe(0);
    expect(debut.getMinutes()).toBe(0);
  });
});
