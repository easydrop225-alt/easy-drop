/**
 * Convertit un lien YouTube ou Vimeo classique (celui qu'on copie depuis la
 * barre d'adresse ou le bouton "Partager") en URL intégrable dans une balise
 * <iframe>. Si le lien n'est reconnu ni comme YouTube ni comme Vimeo, il est
 * retourné tel quel (utile pour d'autres hébergeurs qui supportent déjà
 * l'intégration directe).
 */
export function urlEmbedVideo(url: string): string {
  try {
    const u = new URL(url);

    // YouTube : youtube.com/watch?v=XXXX, youtu.be/XXXX, youtube.com/shorts/XXXX
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      let id = "";
      if (u.hostname.includes("youtu.be")) {
        id = u.pathname.slice(1);
      } else if (u.pathname.startsWith("/shorts/")) {
        id = u.pathname.replace("/shorts/", "");
      } else {
        id = u.searchParams.get("v") ?? "";
      }
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    // Vimeo : vimeo.com/XXXXXXXX
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }

    return url;
  } catch {
    return url;
  }
}
