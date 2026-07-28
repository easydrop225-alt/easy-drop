"use server";

import { createClient } from "@/lib/supabase/server";

export interface ResultatRecherche {
  type: "commande" | "produit" | "commercial";
  titre: string;
  sousTitre: string;
  lien: string;
}

export async function rechercheGlobale(requete: string): Promise<ResultatRecherche[]> {
  if (requete.trim().length < 2) return [];
  const supabase = await createClient();
  const q = `%${requete.trim()}%`;

  const [{ data: commandes }, { data: produits }, { data: commerciaux }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, numero_commande, client_nom, client_telephone")
      .or(`numero_commande.ilike.${q},client_nom.ilike.${q},client_telephone.ilike.${q}`)
      .limit(5),
    supabase
      .from("products")
      .select("id, nom, reference")
      .or(`nom.ilike.${q},reference.ilike.${q}`)
      .limit(5),
    supabase
      .from("profiles")
      .select("id, nom, prenom, telephone, nom_boutique")
      .eq("role", "commercial")
      .or(`nom.ilike.${q},prenom.ilike.${q},telephone.ilike.${q},nom_boutique.ilike.${q}`)
      .limit(5),
  ]);

  const resultats: ResultatRecherche[] = [];

  for (const c of commandes ?? []) {
    resultats.push({
      type: "commande",
      titre: c.numero_commande,
      sousTitre: `${c.client_nom} — ${c.client_telephone}`,
      lien: `/admin/commandes/${c.id}`,
    });
  }
  for (const p of produits ?? []) {
    resultats.push({
      type: "produit",
      titre: p.nom,
      sousTitre: p.reference,
      lien: `/admin/produits/${p.id}/edit`,
    });
  }
  for (const c of commerciaux ?? []) {
    resultats.push({
      type: "commercial",
      titre: `${c.prenom} ${c.nom}`,
      sousTitre: c.nom_boutique ? `${c.nom_boutique} — ${c.telephone}` : c.telephone,
      lien: `/admin/commerciaux`,
    });
  }

  return resultats;
}
