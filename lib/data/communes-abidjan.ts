/**
 * Communes desservies à Abidjan et leur tarif de livraison associé.
 *
 * Transcrit à partir du tableau fourni. Si un tarif ou un nom de commune
 * est incorrect, il suffit de modifier ce fichier (une seule source pour
 * toute l'application) — aucune autre partie du code n'a besoin de changer.
 */
export interface CommuneTarif {
  commune: string;
  tarif: number;
}

export const COMMUNES_ABIDJAN: CommuneTarif[] = [
  { commune: "Abatta", tarif: 2000 },
  { commune: "Akoueso", tarif: 2000 },
  { commune: "Abobo", tarif: 2000 },
  { commune: "Abobodoumé", tarif: 2000 },
  { commune: "Abobo N'dotré", tarif: 2000 },
  { commune: "Adjamé", tarif: 1500 },
  { commune: "Agbanyaté", tarif: 2000 },
  { commune: "Anyama", tarif: 2000 },
  { commune: "Attécoubé", tarif: 1500 },
  { commune: "Azito", tarif: 2000 },
  { commune: "Blockhauss", tarif: 1500 },
  { commune: "Bingerville", tarif: 2000 },
  { commune: "Cocody", tarif: 1500 },
  { commune: "Cocody Palmeraie", tarif: 2000 },
  { commune: "2 Plateaux Cocody", tarif: 1500 },
  { commune: "Angré Cocody", tarif: 2000 },
  { commune: "Cocody Faya", tarif: 2000 },
  { commune: "Djorobité", tarif: 2000 },
  { commune: "Ebimpé", tarif: 2000 },
  { commune: "Gonzagueville", tarif: 2000 },
  { commune: "Grand Bassam", tarif: 3000 },
  { commune: "Koumassi", tarif: 1500 },
  { commune: "M'badon", tarif: 2000 },
  { commune: "M'pouto", tarif: 2000 },
  { commune: "Marcory", tarif: 1500 },
  { commune: "Plateau", tarif: 2000 },
  { commune: "Port-Bouët", tarif: 2000 },
  { commune: "Songon", tarif: 2500 },
  { commune: "Treichville", tarif: 1500 },
  { commune: "Yopougon", tarif: 2000 },
];

export function tarifPourCommune(nomCommune: string): number | undefined {
  const trouve = COMMUNES_ABIDJAN.find(
    (c) => c.commune.toLowerCase() === nomCommune.trim().toLowerCase()
  );
  return trouve?.tarif;
}
