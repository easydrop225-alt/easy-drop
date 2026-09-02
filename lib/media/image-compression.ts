// Compression des photos produits avant upload : réduit poids de page et coût de stockage Supabase.
export const MAX_DIMENSION_PHOTO = 1920;
export const QUALITE_COMPRESSION = 0.82;
// GIF (animation) et SVG (vectoriel) : le passage par <canvas> les détruirait, on les laisse tels quels.
const TYPES_NON_COMPRESSIBLES = ["image/gif", "image/svg+xml"];

/**
 * Calcule les dimensions cibles pour tenir dans maxDimension en conservant le ratio,
 * sans jamais agrandir une image déjà plus petite.
 */
export function calculerDimensionsCompression(
  largeurOriginale: number,
  hauteurOriginale: number,
  maxDimension: number = MAX_DIMENSION_PHOTO
): { largeur: number; hauteur: number } {
  if (largeurOriginale <= maxDimension && hauteurOriginale <= maxDimension) {
    return { largeur: largeurOriginale, hauteur: hauteurOriginale };
  }

  const ratio =
    largeurOriginale >= hauteurOriginale ? maxDimension / largeurOriginale : maxDimension / hauteurOriginale;

  return {
    largeur: Math.round(largeurOriginale * ratio),
    hauteur: Math.round(hauteurOriginale * ratio),
  };
}

/**
 * Compresse une photo produit côté navigateur (redimensionnement + réencodage) avant upload.
 * Retourne le fichier original si le type n'est pas compressible ou si la compression échoue
 * ou n'apporte aucun gain — jamais d'échec bloquant pour l'utilisateur.
 */
export async function compresserImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || TYPES_NON_COMPRESSIBLES.includes(file.type)) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const { largeur, hauteur } = calculerDimensionsCompression(bitmap.width, bitmap.height);

    const dejaCompacte = largeur === bitmap.width && hauteur === bitmap.height && file.size < 500_000;
    if (dejaCompacte) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = largeur;
    canvas.height = hauteur;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, largeur, hauteur);
    bitmap.close();

    // PNG conservé en PNG (transparence potentielle), tout le reste converti en JPEG (plus léger).
    const typeSortie = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, typeSortie, QUALITE_COMPRESSION)
    );

    if (!blob || blob.size >= file.size) {
      return file;
    }

    const extension = typeSortie === "image/png" ? "png" : "jpg";
    const nomCompresse = file.name.replace(/\.\w+$/, `.${extension}`);

    return new File([blob], nomCompresse, { type: typeSortie, lastModified: Date.now() });
  } catch {
    return file;
  }
}
