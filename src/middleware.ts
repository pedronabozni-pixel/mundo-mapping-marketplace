import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://qaqbpjfbxyqtduxroitc.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhcWJwamZieHlxdGR1eHJvaXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMDMxNjgsImV4cCI6MjA5MzU3OTE2OH0.gOw-I_hKsK41N6EvdNxBrzFkwTEPoo156RORLVaIgdE";

const LEGACY_PREFIXES = ["/app", "/admin", "/admin-loja", "/loja", "/painel", "/buscar", "/favoritos", "/receitas", "/resultados", "/activate-account", "/login", "/reset-password"];

function isLegacyPath(pathname: string) {
  return LEGACY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isLegacyPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/mundo-mapping/legado-desativado";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  const isAfiliados = pathname === "/mundo-mapping/afiliados" || pathname.startsWith("/mundo-mapping/afiliados/");
  const isInfluenciadores = pathname === "/mundo-mapping/influenciadores" || pathname.startsWith("/mundo-mapping/influenciadores/");
  const isAdmin = pathname === "/mundo-mapping/admin" || pathname.startsWith("/mundo-mapping/admin/");

  if (isAfiliados || isInfluenciadores || isAdmin) {
    let response = NextResponse.next({ request });

    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = isInfluenciadores
        ? "/mundo-mapping/influenciador/login"
        : "/mundo-mapping/empresa/login";
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Legacy paths
    "/app/:path*",
    "/admin/:path*",
    "/admin-loja/:path*",
    "/loja/:path*",
    "/painel/:path*",
    "/buscar/:path*",
    "/favoritos/:path*",
    "/receitas/:path*",
    "/resultados/:path*",
    "/activate-account/:path*",
    "/login/:path*",
    "/reset-password/:path*",
    "/app",
    "/admin",
    "/admin-loja",
    "/loja",
    "/painel",
    "/buscar",
    "/favoritos",
    "/receitas",
    "/resultados",
    "/activate-account",
    "/login",
    "/reset-password",
    // Protected routes
    "/mundo-mapping/afiliados",
    "/mundo-mapping/afiliados/:path*",
    "/mundo-mapping/influenciadores",
    "/mundo-mapping/influenciadores/:path*",
    "/mundo-mapping/admin",
    "/mundo-mapping/admin/:path*",
  ],
};
