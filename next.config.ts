import type { NextConfig } from "next";

// ── Content-Security-Policy (Report-Only) ────────────────────────────────────
// Aplicado como Report-Only: o browser LOGA violações no console mas NÃO bloqueia
// nada — zero risco de quebrar a app. Domínios externos detectados no código:
//   • Supabase (REST + Storage + Realtime/WebSocket): *.supabase.co / wss
//   • Asaas (pagamentos): api.asaas.com, sandbox.asaas.com
//   • ViaCEP (autopreenchimento de endereço): viacep.com.br
//   • Embeds de aula: youtube.com, player.vimeo.com
//   • Hotmart (link de pagamento): pay.hotmart.com
//   • Imagens: Supabase Storage, Unsplash, data:/blob:
//   • Fontes/estilos: self-hosted (next/font) + Google Fonts como fallback
// AÇÃO FUTURA: após validar que NÃO há violações relevantes nos logs do browser,
// trocar "Content-Security-Policy-Report-Only" por "Content-Security-Policy"
// (enforcing) para passar a bloquear de fato.
const cspReportOnly = [
  "default-src 'self'",
  // Next.js precisa de inline/eval (dev e runtime). Em prod, avaliar remover 'unsafe-eval'.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.asaas.com https://sandbox.asaas.com https://viacep.com.br",
  "frame-src 'self' https://www.youtube.com https://player.vimeo.com https://pay.hotmart.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Report-Only: loga violações sem bloquear. Trocar para enforcing após validar.
  { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
];

const nextConfig: NextConfig = {
  // Force NEXT_PUBLIC_* vars into the client bundle at build time. This is
  // belt-and-suspenders for Railway, whose Nixpacks build occasionally fails
  // to expose dashboard env vars during `next build`, leaving the client with
  // an unconfigured Supabase client (`supabaseUrl is required`).
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
    }
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
