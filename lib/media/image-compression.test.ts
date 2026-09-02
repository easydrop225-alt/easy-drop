import { describe, it, expect } from "vitest";
import { calculerDimensionsCompression, MAX_DIMENSION_PHOTO } from "./image-compression";

describe("calculerDimensionsCompression", () => {
  it("ne change rien si l'image tient déjà dans la limite", () => {
    expect(calculerDimensionsCompression(800, 600)).toEqual({ largeur: 800, hauteur: 600 });
  });

  it("ne change rien si l'image fait exactement la dimension max", () => {
    expect(calculerDimensionsCompression(MAX_DIMENSION_PHOTO, 1080)).toEqual({
      largeur: MAX_DIMENSION_PHOTO,
      hauteur: 1080,
    });
  });

  it("réduit une image paysage en conservant le ratio", () => {
    expect(calculerDimensionsCompression(4000, 2000, 2000)).toEqual({ largeur: 2000, hauteur: 1000 });
  });

  it("réduit une image portrait en conservant le ratio", () => {
    expect(calculerDimensionsCompression(2000, 4000, 2000)).toEqual({ largeur: 1000, hauteur: 2000 });
  });

  it("réduit une image carrée sur les deux dimensions", () => {
    expect(calculerDimensionsCompression(3000, 3000, 1500)).toEqual({ largeur: 1500, hauteur: 1500 });
  });

  it("n'agrandit jamais une image plus petite que la limite", () => {
    expect(calculerDimensionsCompression(400, 300, 1920)).toEqual({ largeur: 400, hauteur: 300 });
  });

  it("arrondit les dimensions calculées à l'entier", () => {
    expect(calculerDimensionsCompression(3333, 1000, 2000)).toEqual({ largeur: 2000, hauteur: 600 });
  });
});
