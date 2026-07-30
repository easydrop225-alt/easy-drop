/**
 * Génère et télécharge un fichier CSV (s'ouvre directement dans Excel).
 * Volontairement du CSV simple plutôt qu'une vraie bibliothèque Excel :
 * plus léger, aucune dépendance supplémentaire, et Excel l'ouvre nativement.
 */
export function exporterCSV(nomFichier: string, colonnes: string[], lignes: (string | number)[][]) {
  const echapper = (valeur: string | number) => {
    const texte = String(valeur ?? "");
    if (texte.includes(";") || texte.includes('"') || texte.includes("\n")) {
      return `"${texte.replace(/"/g, '""')}"`;
    }
    return texte;
  };

  const contenu = [colonnes, ...lignes]
    .map((ligne) => ligne.map(echapper).join(";"))
    .join("\r\n");

  // Le BOM UTF-8 assure que les accents s'affichent correctement dans Excel.
  const blob = new Blob(["\uFEFF" + contenu], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = `${nomFichier}.csv`;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  URL.revokeObjectURL(url);
}
