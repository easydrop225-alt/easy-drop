import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Reçoit les erreurs remontées par les écrans error.tsx (client) et
 * prévient l'admin par notification push — en réutilisant l'infrastructure
 * déjà en place (table `notifications` + webhook existant vers
 * send-push-notification), sans nouvelle fonction ni nouveau service.
 *
 * Pas d'authentification requise : une erreur peut survenir avant même
 * qu'une session soit établie. Le risque d'abus est limité (au pire,
 * quelqu'un déclenche de fausses notifications, sans accès à aucune
 * donnée).
 */
export async function POST(request: NextRequest) {
  try {
    const { message, digest, page } = (await request.json()) as {
      message?: string;
      digest?: string;
      page?: string;
    };

    const admin = createAdminClient();

    const { data: admins } = await admin
      .from("profiles")
      .select("id")
      .in("role", ["admin", "super_admin"]);

    if (!admins || admins.length === 0) {
      return NextResponse.json({ ok: true, notifies: 0 });
    }

    const titre = "⚠️ Erreur technique sur Easy Drop";
    const details = [
      page ? `Page : ${page}` : null,
      message ? `Message : ${message.slice(0, 200)}` : null,
      digest ? `Référence : ${digest}` : null,
    ].filter(Boolean).join(" — ");

    await admin.from("notifications").insert(
      admins.map((a) => ({
        destinataire_id: a.id,
        type: "erreur_technique",
        titre,
        message: details || "Une erreur est survenue sur l'application.",
        lien: page ?? "/admin/dashboard",
      }))
    );

    return NextResponse.json({ ok: true, notifies: admins.length });
  } catch {
    // Ne doit jamais faire planter la page qui signale déjà une erreur.
    return NextResponse.json({ ok: false });
  }
}
