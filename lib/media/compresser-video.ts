/**
 * Compression vidéo dans le navigateur (WebCodecs, via mediabunny) :
 * ré-encode en MP4 H.264 720p (côté le plus court), ~1,5 Mb/s, son AAC
 * 96 kb/s, « fast start » (lecture immédiate). Rien n'est envoyé à un
 * serveur pour la conversion : aucun quota Vercel/Supabase consommé.
 *
 * Renvoie `null` si le navigateur ne sait pas encoder (ancien iPhone,
 * Firefox…) ou si le résultat ne serait pas plus léger : on garde alors
 * le fichier d'origine.
 */
export const COTE_COURT_MAX = 720;
export const DEBIT_VIDEO = 1_500_000;

export async function compresserVideo(
  fichier: Blob,
  nom: string,
  onProgress?: (fraction: number) => void,
): Promise<File | null> {
  if (typeof window === "undefined" || typeof (window as unknown as { VideoEncoder?: unknown }).VideoEncoder === "undefined") {
    return null;
  }
  try {
    // Chargé seulement quand on compresse une vidéo (jamais pour les commerciaux).
    const mb = await import("mediabunny");
    const input = new mb.Input({ formats: mb.ALL_FORMATS, source: new mb.BlobSource(fichier) });
    const piste = await input.getPrimaryVideoTrack();
    if (!piste) return null;

    const largeur = piste.displayWidth;
    const hauteur = piste.displayHeight;
    const coteCourt = Math.min(largeur, hauteur);
    const echelle = coteCourt > COTE_COURT_MAX ? COTE_COURT_MAX / coteCourt : 1;
    const pair = (n: number) => Math.max(2, Math.round(n / 2) * 2);
    const cibleL = pair(largeur * echelle);
    const cibleH = pair(hauteur * echelle);

    if (!(await mb.canEncodeVideo("avc", { width: cibleL, height: cibleH, bitrate: DEBIT_VIDEO }))) return null;
    const aacOk = await mb.canEncodeAudio("aac");

    const sortie = new mb.Output({
      format: new mb.Mp4OutputFormat({ fastStart: "in-memory" }),
      target: new mb.BufferTarget(),
    });
    const conversion = await mb.Conversion.init({
      input,
      output: sortie,
      video: {
        codec: "avc",
        bitrate: DEBIT_VIDEO,
        forceTranscode: true,
        ...(echelle < 1 ? (largeur <= hauteur ? { width: cibleL } : { height: cibleH }) : {}),
      },
      audio: aacOk ? { codec: "aac", bitrate: 96_000 } : undefined,
      showWarnings: false,
    });
    if (!conversion.isValid) return null;
    conversion.onProgress = (p) => onProgress?.(p);
    await conversion.execute();

    const buffer = sortie.target.buffer;
    if (!buffer || buffer.byteLength >= fichier.size * 0.9) return null;
    const base = nom.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9.-]/g, "_");
    return new File([buffer], `${base}-720p.mp4`, { type: "video/mp4" });
  } catch {
    return null;
  }
}

/** Taille d'un fichier en ligne (sans le télécharger). */
export async function tailleEnLigne(url: string): Promise<number | null> {
  try {
    const r = await fetch(url, { method: "HEAD" });
    const n = Number(r.headers.get("content-length"));
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function enMo(octets: number): string {
  return `${(octets / 1024 / 1024).toFixed(octets < 10 * 1024 * 1024 ? 1 : 0)} Mo`;
}
