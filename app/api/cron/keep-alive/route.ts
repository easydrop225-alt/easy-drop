import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Appelée automatiquement chaque jour par Vercel Cron (voir vercel.json).
 *
 * But : le plan gratuit de Supabase met en pause un projet après 7 jours
 * sans la moindre requête. Une simple lecture triviale une fois par jour
 * suffit à garder le projet actif indéfiniment, sans dépendre de visites
 * réelles sur le site.
 *
 * Vercel envoie automatiquement un en-tête "Authorization: Bearer
 * <CRON_SECRET>" pour ses propres appels programmés dès que la variable
 * d'environnement CRON_SECRET est définie — ça empêche n'importe qui
 * d'appeler cette route depuis l'extérieur pour épuiser des ressources.
 */
export async function GET(request: NextRequest) {
  const secretAttendu = process.env.CRON_SECRET;
  if (secretAttendu) {
    const enTete = request.headers.get("authorization");
    if (enTete !== `Bearer ${secretAttendu}`) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    // Requête volontairement minimale : juste besoin que Supabase enregistre
    // une activité, peu importe le résultat exact.
    await supabase.from("categories").select("id").limit(1);

    return NextResponse.json({ ok: true, verifieLe: new Date().toISOString() });
  } catch (error) {
    // On répond quand même 200 : l'objectif (générer une requête vers
    // Supabase) est atteint même si la requête elle-même échoue.
    return NextResponse.json({ ok: false, error: String(error) });
  }
}
