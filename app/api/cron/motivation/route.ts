import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Rappel motivationnel envoyé automatiquement 1 jour sur 2 à tous les
 * commerciaux actifs (validés), sous forme de notification push — pour les
 * inciter à publier, prospecter de nouveaux clients, se connecter voir les
 * nouveautés du catalogue, et télécharger des photos pour leurs publicités
 * Facebook/TikTok. Ton : jargon ivoirien, motivant, jamais moralisateur.
 *
 * Appelée automatiquement chaque jour à 12h (heure d'Abidjan = UTC) par
 * Vercel Cron (voir vercel.json) — mais n'envoie réellement qu'un jour sur
 * deux (voir estJourDenvoi ci-dessous), sans avoir besoin de retenir un
 * état entre deux exécutions : le calcul est basé uniquement sur la date du
 * jour, donc fiable même après une pause ou un redéploiement.
 */
const MESSAGES = [
  "Joe, tu dors pendant que tes clients t'attendent sur Facebook ! Connecte-toi vite à Easy Drop et publie 📲",
  "Pendant que toi tu as mangé, tu t'es reposé, un autre est en train de vendre. Bouge-toi, va publier ! 🔥",
  "Un produit qui dort dans le catalogue, c'est un bénéfice qui dort aussi. Télécharge les photos et publie aujourd'hui 📸",
  "Y'a des nouveaux produits sur Easy Drop depuis hier. Connecte-toi vite avant que les autres commerciaux prennent de l'avance 👀",
  "TikTok, Facebook, WhatsApp Statut... tes clients sont partout. Toi t'es où ? Va publier maintenant 🚀",
  "Le client qui va t'acheter aujourd'hui, il ne te trouvera pas si tu ne publies pas. Bouge un peu 💪",
  "Une seule commande aujourd'hui peut tout changer. Connecte-toi, choisis un produit, publie-le 📦",
  "Pendant que tu te reposes, ton concurrent poste sur TikTok. Ne le laisse pas gagner ta place 🏃",
  "Nouveau jour, nouveaux clients à trouver. Télécharge une photo, poste-la, et regarde les commandes venir ✨",
];

function jourEpoque(): number {
  return Math.floor(Date.now() / 86_400_000);
}

function estJourDenvoi(): boolean {
  return jourEpoque() % 2 === 0;
}

export async function GET(request: NextRequest) {
  const secretAttendu = process.env.CRON_SECRET;
  if (secretAttendu) {
    const enTete = request.headers.get("authorization");
    if (enTete !== `Bearer ${secretAttendu}`) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  if (!estJourDenvoi()) {
    return NextResponse.json({ ok: true, envoye: false, raison: "Pas le jour prévu (1 jour sur 2)." });
  }

  try {
    const admin = createAdminClient();
    const message = MESSAGES[jourEpoque() % MESSAGES.length];

    const { data: commerciaux, error: erreurLecture } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "commercial")
      .eq("statut", "valide");

    if (erreurLecture) throw erreurLecture;
    if (!commerciaux || commerciaux.length === 0) {
      return NextResponse.json({ ok: true, envoye: true, nombre: 0 });
    }

    const { error: erreurInsert } = await admin.from("notifications").insert(
      commerciaux.map((c) => ({
        destinataire_id: c.id,
        type: "motivation",
        titre: "Easy Drop",
        message,
        lien: "/catalogue",
      }))
    );

    if (erreurInsert) throw erreurInsert;

    return NextResponse.json({ ok: true, envoye: true, nombre: commerciaux.length, message });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
