import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LEGACY_PREFIXES = ["/app", "/admin", "/admin-loja", "/loja", "/painel", "/buscar", "/favoritos", "/receitas", "/resultados", "/activate-account", "/login", "/reset-password"];

function isLegacyPath(pathname: string) {
  return LEGACY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isLegacyPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/mundo-mapping/legado-desativado";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
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
    "/reset-password"
  ]
};
