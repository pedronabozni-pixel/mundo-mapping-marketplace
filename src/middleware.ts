import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LEGACY_PREFIXES = ["/app", "/admin", "/admin-loja", "/loja", "/painel", "/buscar", "/favoritos", "/receitas", "/resultados", "/activate-account", "/login", "/reset-password"];

function isLegacyPath(pathname: string) {
  return LEGACY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Keep existing legacy redirects
  if (isLegacyPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/mundo-mapping/legado-desativado";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  const isAfiliados = pathname.startsWith("/mundo-mapping/afiliados");
  const isInfluenciadores = pathname.startsWith("/mundo-mapping/influenciadores");

  // Only run auth check on protected routes
  if (!isAfiliados && !isInfluenciadores) {
    return NextResponse.next();
  }

  // Skip auth if Supabase env vars not set (allows build/dev without .env.local)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // getUser() validates the session server-side (safe for middleware)
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = isAfiliados
      ? "/mundo-mapping/empresa/login"
      : "/mundo-mapping/influenciador/login";
    return NextResponse.redirect(loginUrl);
  }

  return response;
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
  ],
};
