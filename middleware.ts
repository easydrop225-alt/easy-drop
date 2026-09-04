import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes de l'espace commercial (groupe app/(commercial)) : nécessitent une
// session valide, quel que soit le rôle.
const ROUTES_COMMERCIAL = [
  "/a-propos",
  "/accueil",
  "/attente-validation",
  "/catalogue",
  "/commandes",
  "/dashboard",
  "/formation",
  "/gains",
  "/notifications",
  "/onboarding",
  "/profil",
];

// Routes publiques, jamais protégées.
const ROUTES_PUBLIQUES = [
  "/",
  "/connexion",
  "/inscription",
  "/produits",
  "/mot-de-passe-oublie",
  "/reinitialiser-mot-de-passe",
  "/auth/callback",
];

function estRoutePublique(pathname: string) {
  return ROUTES_PUBLIQUES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

function estRouteCommerciale(pathname: string) {
  return ROUTES_COMMERCIAL.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Vérifie la session à partir du cookie, sans appel réseau systématique
  // vers Supabase (contrairement à getUser(), qui revalide le jeton auprès
  // du serveur à CHAQUE navigation — un aller-retour réseau supplémentaire
  // ressenti comme une latence entre les onglets). getSession() ne fait un
  // appel réseau que lorsque le jeton a réellement besoin d'être renouvelé.
  //
  // Ce contrôle sert uniquement à rediriger rapidement vers la connexion :
  // la vraie barrière de sécurité reste les policies RLS de la base de
  // données et les vérifications faites dans les pages/actions serveur,
  // qui utilisent bien getUser() là où ça compte réellement.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const { pathname } = request.nextUrl;

  if (estRoutePublique(pathname)) {
    return response;
  }

  // Espace admin : réservé aux rôles admin / super_admin.
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/connexion";
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin" && profile?.role !== "super_admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/accueil";
      return NextResponse.redirect(url);
    }

    return response;
  }

  // Espace commercial : nécessite juste une session valide.
  if (estRouteCommerciale(pathname)) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/connexion";
      return NextResponse.redirect(url);
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Applique le middleware à toutes les routes SAUF :
     * - fichiers statiques Next.js (_next/static, _next/image)
     * - favicon et icônes
     * - fichiers avec une extension (images, manifest, service worker...)
     */
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
