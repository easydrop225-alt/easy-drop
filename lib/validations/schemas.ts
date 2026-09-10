import { z } from "zod";

// 6 caractères minimum, avec au moins une majuscule, une minuscule, un
// chiffre et un symbole — appliqué à l'inscription ET à la réinitialisation
// du mot de passe (voir aussi components/ui/password-input.tsx pour
// l'équivalent côté affichage/checklist).
export const motDePasseSchema = z
  .string()
  .min(6, "6 caractères minimum")
  .regex(/[A-Z]/, "Au moins une majuscule")
  .regex(/[a-z]/, "Au moins une minuscule")
  .regex(/\d/, "Au moins un chiffre")
  .regex(/[^A-Za-z0-9]/, "Au moins un symbole (ex : ! ? # @ %)");

export const inscriptionSchema = z.object({
  nom: z.string().min(2, "Le nom est requis"),
  prenom: z.string().min(2, "Le prénom est requis"),
  telephone: z.string().regex(/^\+225\d{10}$/, "Format attendu : +225XXXXXXXXXX"),
  email: z.string().email().optional().or(z.literal("")),
  motDePasse: motDePasseSchema,
  nomBoutique: z.string().min(2, "Le nom de la boutique est requis").max(100),
});
export type InscriptionInput = z.infer<typeof inscriptionSchema>;

export const connexionSchema = z.object({
  identifiant: z.string().min(3, "Téléphone ou email requis"),
  motDePasse: z.string().min(1, "Mot de passe requis"),
});
export type ConnexionInput = z.infer<typeof connexionSchema>;

export const motDePasseOublieSchema = z.object({
  email: z.string().email("Adresse email invalide"),
});
export type MotDePasseOublieInput = z.infer<typeof motDePasseOublieSchema>;

export const reinitialiserMotDePasseSchema = z.object({
  motDePasse: motDePasseSchema,
});
export type ReinitialiserMotDePasseInput = z.infer<typeof reinitialiserMotDePasseSchema>;

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
  typeOffre: z.enum(["unique", "lot"]).default("unique"),
  quantiteParLot: z.coerce.number().int().min(2).optional(),
}).refine((v) => v.typeOffre === "unique" || v.quantiteParLot !== undefined, {
  message: "Indique le nombre de pièces par lot.",
  path: ["quantiteParLot"],
});
export type ProduitInput = z.infer<typeof produitSchema>;

const ligneCommandeSchema = z.object({
  productVariantId: z.string().uuid().nullable(),
  quantite: z.coerce.number().int().min(1),
});

const produitCommandeSchema = z.object({
  productId: z.string().uuid(),
  lignes: z.array(ligneCommandeSchema).min(1),
  prixVente: z.coerce.number().positive("Le prix de vente doit être supérieur à 0."),
});

// Le lieu de livraison n'a pas la même forme selon la zone : commune +
// quartier pour une livraison à Abidjan, ville + gare pour une expédition —
// un seul des deux couples est donc réellement requis, selon `zone`.
export const nouvelleCommandeSchema = z
  .object({
    produits: z.array(produitCommandeSchema).min(1, "Ajoute au moins un produit à la commande."),
    clientNom: z.string().min(2),
    clientTelephone: z.string().min(8),
    clientCommune: z.string().optional(),
    clientAdresse: z.string().optional(),
    zone: z.enum(["abidjan", "hors_abidjan"]),
    modeLivraison: z.enum(["normal", "yango_urgent"]).default("normal"),
    fraisLivraison: z.coerce.number().min(0),
    observation: z.string().max(500).optional(),
    gare: z.string().max(200).optional(),
    villeExpedition: z.string().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.zone === "abidjan") {
      if (!data.clientCommune || data.clientCommune.trim().length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Commune requise.", path: ["clientCommune"] });
      }
      if (!data.clientAdresse || data.clientAdresse.trim().length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Quartier requis.", path: ["clientAdresse"] });
      }
    } else {
      if (!data.villeExpedition || data.villeExpedition.trim().length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ville de destination requise.", path: ["villeExpedition"] });
      }
      if (!data.gare || data.gare.trim().length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Gare requise.", path: ["gare"] });
      }
    }
  });
export type NouvelleCommandeInput = z.infer<typeof nouvelleCommandeSchema>;

export const paiementSchema = z.object({
  commercialId: z.string().uuid(),
  montant: z.coerce.number().positive(),
  mode: z.enum(["wave", "orange_money", "especes"]),
  referencePaiement: z.string().optional(),
});
export type PaiementInput = z.infer<typeof paiementSchema>;
