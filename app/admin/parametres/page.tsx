import { createClient } from "@/lib/supabase/server";
import type { Setting, Product } from "@/types/database";
import { ParametresForm } from "./form";
import { SonNotificationUploader } from "@/components/shared/son-notification-uploader";
import { AccueilCommercialForm } from "./accueil-commercial-form";
import { Card } from "@/components/ui/card";

export default async function ParametresPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("settings").select("*");
  const { data: produits } = await supabase.from("products").select("*").eq("actif", true).order("nom");
  const list = (settings ?? []) as Setting[];
  const get = (cle: string) => list.find((s) => s.cle === cle)?.valeur;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="mb-6 text-2xl font-semibold">Paramètres</h1>

      <Card>
        <h2 className="mb-3 font-medium">Accueil commercial</h2>
        <AccueilCommercialForm
          texteActuel={(get("accueil_texte") as string | undefined) ?? "Des produits à prix revendeur, une logistique 100% prise en charge !"}
          modeActuel={(get("produits_vedette_mode") as "statique" | "aleatoire" | undefined) ?? "aleatoire"}
          produitsVedetteActuels={(get("produits_vedette_ids") as string[] | undefined) ?? []}
          produits={(produits ?? []) as Product[]}
        />
      </Card>

      <ParametresForm
        fraisAbidjan={get("frais_livraison_abidjan") as { min: number; max: number } | undefined}
        fraisHorsAbidjan={get("frais_livraison_hors_abidjan") as { min: number; max: number } | undefined}
        whatsapp={get("whatsapp_numero") as string | undefined}
        horaires={get("horaires") as string | undefined}
      />
      <Card>
        <h2 className="mb-3 font-medium">Son de notification (nouvelle commande)</h2>
        <SonNotificationUploader sonActuelUrl={get("son_notification_url") as string | undefined ?? null} />
      </Card>
    </div>
  );
}
