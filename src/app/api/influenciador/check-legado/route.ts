import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeEmail } from "@/lib/normalize-email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Rota PÚBLICA (roda no formulário de cadastro, sem sessão): diz se o e-mail
// pertence à base legado ainda não ativada, para o form virar ativação.
//
// Resposta MÍNIMA por design: nome + handles/seguidores das redes, e nada além.
// NUNCA retorna: celular, cidade, o próprio e-mail de volta, asaas_customer_id,
// asaas_wallet_id, legacy_id. "Não encontrado" e "já ativado" respondem
// IDÊNTICO ({ reconhecido: false }) para não vazar estado da base.
export async function POST(req: NextRequest) {
  // Limite apertado: a rota confirma existência de e-mail na base.
  const ip = getClientIp(req);
  const rl = checkRateLimit(`check-legado:${ip}`, 10, 60000);
  if (rl.limited) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente em instantes." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ reconhecido: false });
  }

  const email = normalizeEmail(body?.email ?? "");
  if (!email || !email.includes("@")) {
    return NextResponse.json({ reconhecido: false });
  }

  try {
    const { data } = await createAdminClient()
      .from("creators_legado")
      .select("nome, instagram, instagram_seguidores, tiktok, tiktok_seguidores, youtube, youtube_inscritos")
      .eq("email_normalizado", email)
      .eq("ativado", false)
      .maybeSingle();

    if (!data) {
      return NextResponse.json({ reconhecido: false });
    }

    const redes: Record<string, { handle: string; seguidores: number | null }> = {};
    if (data.instagram) redes.instagram = { handle: data.instagram, seguidores: data.instagram_seguidores };
    if (data.tiktok) redes.tiktok = { handle: data.tiktok, seguidores: data.tiktok_seguidores };
    if (data.youtube) redes.youtube = { handle: data.youtube, seguidores: data.youtube_inscritos };

    return NextResponse.json({
      reconhecido: true,
      nome: data.nome ?? null,
      redes,
    });
  } catch {
    // Falha interna não pode travar o cadastro: responde como não reconhecido.
    return NextResponse.json({ reconhecido: false });
  }
}
