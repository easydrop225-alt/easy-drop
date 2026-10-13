/**
 * Lien WhatsApp vers un numéro ivoirien. Depuis 2021 les numéros font
 * 10 chiffres et gardent leur 0 en international : 07 47 00 00 57 → 2250747000057.
 */
export function lienWhatsApp(telephone: string): string {
  let n = telephone.replace(/\D/g, "");
  if (n.startsWith("00")) n = n.slice(2);
  if (!(n.startsWith("225") && n.length === 13)) n = "225" + n;
  return `https://wa.me/${n}`;
}
