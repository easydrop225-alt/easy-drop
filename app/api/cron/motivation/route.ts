import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Rappel motivationnel envoyé automatiquement 1 jour sur 2 à tous les
 * commerciaux actifs (validés), sous forme de notification push — pour les
 * inciter à publier, prospecter de nouveaux clients, se connecter voir les
 * nouveautés du catalogue, et télécharger des photos pour leurs publicités
 * Facebook/TikTok. Ton : jargon ivoirien, motivant, jamais moralisateur.
 *
 * Appelée automatiquement chaque jour à 8h et 19h (heure d'Abidjan = UTC) par
 * Vercel Cron (voir vercel.json) — mais n'envoie réellement qu'un jour sur
 * deux (voir estJourDenvoi ci-dessous), sans avoir besoin de retenir un
 * état entre deux exécutions : le calcul est basé uniquement sur la date du
 * jour, donc fiable même après une pause ou un redéploiement.
 */
const MESSAGES = [
  // Sélection du premier lot de 30 (17 messages retenus)
  "Joe, tu dors pendant que tes clients t'attendent sur Facebook ! Connecte-toi vite à Easy Drop et publie 📲",
  "Pendant que toi tu as mangé, tu t'es reposé, un autre est en train de vendre. Bouge-toi, va publier ! 🔥",
  "Y'a pas de mou dans ce game. Une petite commande aujourd'hui, ça fait jamais de mal 📦",
  "Ça fait un moment tu n'as rien publié... Le catalogue t'attend, lui il ne dort pas 👀",
  // Note : ce message a vocation à devenir une notification spéciale
  // déclenchée à l'ajout d'un nouveau produit (répétée jusqu'à connexion)
  // — pour l'instant, il tourne comme les autres en attendant cette
  // fonctionnalité dédiée.
  "Y'a des nouveaux produits sur Easy Drop depuis hier. Connecte-toi vite avant que les autres commerciaux prennent de l'avance 👀",
  "On est ensemble, mais dans le business c'est chacun pour sa poche. Va chercher tes clients 💼",
  "Un produit qui dort dans le catalogue, c'est un bénéfice qui dort aussi. Télécharge les photos et publie aujourd'hui 📸",
  "Une seule commande aujourd'hui peut tout changer. Connecte-toi, choisis un produit, publie-le 📦",
  "Nouveau jour, nouveaux clients à trouver. Télécharge une photo, poste-la, et regarde les commandes venir ✨",
  "Aujourd'hui c'est pas le jour du repos, c'est le jour du bénéfice 💪",
  "Ton prochain client est peut-être en train de scroller TikTok là maintenant. Donne-lui une raison de te trouver 🎯",
  "TikTok, Facebook, WhatsApp Statut... tes clients sont partout. Toi t'es où ? Va publier maintenant 🚀",
  "Le client qui va t'acheter aujourd'hui, il ne te trouvera pas si tu ne publies pas. Bouge un peu 💪",
  "Facebook ne va pas publier tout seul à ta place. Télécharge, poste, encaisse 💰",
  "Wê wê, tu as oublié Easy Drop ou c'est Easy Drop qui t'a oublié ? Viens vérifier 😄",
  "Allô ? Allô ? On te cherche depuis ce matin sur Easy Drop 📞",
  "On dirait que ton compte fait la grève aujourd'hui. On règle ça ? 😄",

  // Lot "interpellation directe / humour" (les 20 retenus intégralement)
  "Ton compte Easy Drop a appelé, il demande si tu te souviens encore de lui 📞",
  "On a cherché ton nom dans les publications d'aujourd'hui... on n'a rien trouvé 🔍",
  "Coucou, c'est encore nous. Oui, encore. Va publier et on arrête de te déranger 😂",
  "Ah tu es là ? Alors pourquoi le catalogue ne t'a pas vu aujourd'hui ? 👀",
  "On ne va pas te mentir : ton compte fait pitié aujourd'hui. On répare ça ? 😅",
  "Breaking news : un commercial n'a toujours pas publié. On te laisse deviner qui 📰",
  "Ton téléphone est bien chargé ? Alors qu'est-ce qui t'empêche de publier ? 🔋",
  "On a mis une alarme pour toi. Elle sonne là, maintenant : va publier ⏰",
  "Tu te reposes bien j'espère, parce que le catalogue lui n'a pas chômé 😴",
  "Message envoyé, lu ou pas lu, on verra. Mais on aura essayé de te réveiller 😏",
  "Tu sais que 'plus tard' peut vite devenir 'jamais' ? On te le dit gentiment 😉",
  "Si Easy Drop pouvait t'appeler par ton prénom, ce serait un truc du genre : 'oh, tu es où ?' 🤔",
  "Toc toc. C'est nous. On vient encore te rappeler d'aller publier 🚪",
  "Ton absence a été remarquée. Ta publication le serait aussi 👋",
  "On ne te juge pas. On te rappelle juste, gentiment, fermement, que le catalogue t'attend 😄",
  "Petit sondage : tu comptes publier aujourd'hui, ou on doit revenir demain ? 🙃",
  "Ton compte a posé une question ce matin : 'il est où mon commercial ?' On relaie 📩",
  "C'est officiel, tu détiens le record du silence le plus long cette semaine 🏆 (à battre !)",
  "On a vérifié deux fois, tu n'as toujours rien publié. La troisième fois c'est promis, on se calme 😂",
  "Un dernier petit mot avant qu'on te laisse tranquille (pour aujourd'hui) : publie 🙏",
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
    // Le matin et le soir reçoivent chacun un message différent (pas deux
    // fois le même le même jour) — déterminé par l'heure UTC de l'appel,
    // qui correspond à l'heure d'Abidjan (UTC+0, pas de décalage).
    const estAppelDuSoir = new Date().getUTCHours() >= 12;
    const decalage = estAppelDuSoir ? Math.floor(MESSAGES.length / 2) : 0;
    const message = MESSAGES[(jourEpoque() + decalage) % MESSAGES.length];

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
