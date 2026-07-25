import { z } from "zod";

export const inscriptionSchema = z.object({
  nom: z.string().min(2, "Le nom est requis"),
  prenom: z.string().min(2, "Le prénom est requis"),
  telephone: z.string().regex(/^\+225\d{10}$/, "Format attendu : +225XXXXXXXXXX"),
  email: z.string().email().optional().or(z.literal("")),
  motDePasse: z.string().min(8, "8 caractères minimum"),
});
export type InscriptionInput = z.infer<typeof inscriptionSchema>;

export const connexionSchema = z.object({
  identifiant: z.string().min(3, "Téléphone ou email requis"),
  motDePasse: z.string().min(1, "Mot de passe requis"),
});
export type ConnexionInput = z.infer<typeof connexionSchema>;

export const produitSchema = z.object({
  nom: z.string().min(2),
  categoryId: z.string().uuid().nullable(),
  description: z.string().optional(),
  prixFournisseur: z.coerce.number().positive(),
  prixMinConseille: z.coerce.number().positive().optional(),
  prixMaxConseille: z.coerce.number().positive().optional(),
  couleurs: z.array(z.string()).default([]),
  tailles: z.array(z.string()).default([]),
  actif: z.boolean().default(true),
});
export type ProduitInput = z.infer<typeof produitSchema>;

export const nouvelleCommandeSchema = z.object({
  productId: z.string().uuid(),
  productVariantId: z.string().uuid().optional(),
  quantite: z.coerce.number().int().min(1),
  prixVenteUnitaire: z.coerce.number().positive(),
  clientNom: z.string().min(2),
  clientTelephone: z.string().min(8),
  clientCommune: z.string().min(2),
  clientAdresse: z.string().min(5),
  zone: z.enum(["abidjan", "hors_abidjan"]),
  modeLivraison: z.enum(["normal", "yango_urgent"]).default("normal"),
  fraisLivraison: z.coerce.number().min(0),
  observation: z.string().max(500).optional(),
});
export type NouvelleCommandeInput = z.infer<typeof nouvelleCommandeSchema>;

export const paiementSchema = z.object({
  commercialId: z.string().uuid(),
  montant: z.coerce.number().positive(),
  mode: z.enum(["wave", "orange_money", "especes"]),
  referencePaiement: z.string().optional(),
});
export type PaiementInput = z.infer<typeof paiementSchema>;
