import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Protège les routes (commercial) et (admin) selon le rôle et le statut
 * du profil connecté. Redirige vers /connexion si non authentifié,
 * ou vers /attente-validation si le compte commercial n'est pas encore validé.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options ?? {})
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isCommercialRoute =
    path.startsWith("/accueil") ||
    path.startsWith("/dashboard") ||
    path.startsWith("/commandes") ||
    path.startsWith("/gains") ||
    path.startsWith("/catalogue") ||
    path.startsWith("/profil") ||
    path.startsWith("/notifications");
  const isAdminRoute = path.startsWith("/admin");

  if (!user && (isCommercialRoute || isAdminRoute)) {
    return NextResponse.redirect(new URL("/connexion", request.url));
  }

  if (user && (isCommercialRoute || isAdminRoute)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, statut")
      .eq("id", user.id)
      .single();

    if (isCommercialRoute && profile?.role === "commercial" && profile.statut !== "valide") {
      return NextResponse.redirect(new URL("/attente-validation", request.url));
    }

    if (isAdminRoute && profile?.role !== "admin" && profile?.role !== "super_admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/accueil/:path*",
    "/dashboard/:path*",
    "/commandes/:path*",
    "/gains/:path*",
    "/catalogue/:path*",
    "/profil/:path*",
    "/notifications/:path*",
    "/admin/:path*",
  ],
};
