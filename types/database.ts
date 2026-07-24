/**
 * Types correspondant au schéma défini dans
 * backend/supabase/migrations/00000000000001_schema.sql
 *
 * À remplacer par la génération automatique dès que le projet Supabase
 * réel existe : npx supabase gen types typescript --project-id <ID>
 */

export type UserRole = "super_admin" | "admin" | "commercial";
export type ProfileStatut = "en_attente" | "valide" | "refuse" | "desactive";
export type OrderStatut =
  | "nouvelle" | "en_attente" | "confirmee" | "en_preparation" | "en_livraison"
  | "livree" | "terminee" | "annulee" | "refusee" | "client_injoignable" | "relance" | "retour";
export type ModeLivraison = "normal" | "yango_urgent";
export type ZoneLivraison = "abidjan" | "hors_abidjan";
export type ModePaiement = "wave" | "orange_money" | "especes";
export type StatutPaiement = "paye" | "en_attente" | "annule";

export interface Profile {
  id: string;
  role: UserRole;
  nom: string;
  prenom: string;
  telephone: string;
  email: string | null;
  statut: ProfileStatut;
  date_validation: string | null;
  valide_par: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  nom: string;
  slug: string;
  ordre: number;
  actif: boolean;
}

export interface Product {
  id: string;
  reference: string;
  nom: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  prix_fournisseur: number;
  prix_min_conseille: number | null;
  prix_max_conseille: number | null;
  couleurs: string[];
  tailles: string[];
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  couleur: string | null;
  taille: string | null;
  stock: number;
}

export interface Media {
  id: string;
  product_id: string;
  type: "image" | "video";
  url: string;
  ordre: number;
}

export interface Inventory {
  id: string;
  product_variant_id: string;
  quantite_disponible: number;
  seuil_alerte: number;
}

export interface Order {
  id: string;
  numero_commande: string;
  commercial_id: string;
  client_nom: string;
  client_telephone: string;
  client_commune: string;
  client_adresse: string;
  statut: OrderStatut;
  motif_annulation: string | null;
  mode_livraison: ModeLivraison;
  zone: ZoneLivraison;
  frais_livraison: number;
  date_livraison_prevue: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_variant_id: string | null;
  quantite: number;
  prix_vente_unitaire: number;
  prix_fournisseur_unitaire: number;
  benefice_ligne: number;
}

export interface Payment {
  id: string;
  commercial_id: string;
  montant: number;
  mode: ModePaiement;
  statut: StatutPaiement;
  date_paiement: string;
  reference_paiement: string | null;
  preuve_url: string | null;
}

export interface Profit {
  id: string;
  order_id: string;
  commercial_id: string;
  montant_benefice: number;
  statut: StatutPaiement;
  created_at: string;
}

export interface Notification {
  id: string;
  destinataire_id: string;
  type: string;
  titre: string;
  message: string | null;
  lu: boolean;
  lien: string | null;
  created_at: string;
}

export interface Setting {
  id: string;
  cle: string;
  valeur: unknown;
  description: string | null;
}

/**
 * Type générique minimal attendu par @supabase/ssr.
 * Les requêtes typées précises se font via les interfaces ci-dessus
 * combinées à un cast (`as Product[]`) en attendant la génération officielle.
 */
export type Database = {
  public: {
    Tables: Record<string, { Row: Record<string, unknown> }>;
    Enums: Record<string, string>;
  };
};
