import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeEmail } from "@/lib/normalize-email";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.userId || !body?.profile) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: { user }, error: authError } = await admin.auth.admin.getUserById(body.userId);
  if (authError || !user) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  // Only allow saving profile for users created in the last hour (signup flow only)
  const createdAt = new Date(user.created_at).getTime();
  if (Date.now() - createdAt > 60 * 60 * 1000) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { error } = await admin
    .from("profiles")
    .upsert({ id: body.userId, ...body.profile }, { onConflict: "id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Ativação da base legado: se o e-mail pertence a um creator ainda não
  // ativado, herda dados para o profile e vincula o registro. Tolerante a
  // falha: o cadastro já está criado — qualquer erro aqui só é logado.
  if (body.profile?.user_type === "influenciador" && body.profile?.email) {
    try {
      await ativarCreatorLegado(admin, body.userId, body.profile.email);
    } catch (err) {
      console.error(
        "[legado] falha na ativação (cadastro segue válido)",
        err instanceof Error ? err.message : err,
      );
    }
  }

  return NextResponse.json({ ok: true });
}

// Copia do legado para o profile APENAS colunas que já existem em profiles e
// APENAS quando o campo está vazio (o que o usuário digitou no form vence).
// NUNCA copia celular nem qualquer dado financeiro/asaas do legado.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ativarCreatorLegado(admin: any, userId: string, email: string) {
  const { data: legado } = await admin
    .from("creators_legado")
    .select("id, nome, bio, cidade, estado, instagram, instagram_seguidores, tiktok, tiktok_seguidores, youtube, youtube_inscritos")
    .eq("email_normalizado", normalizeEmail(email))
    .eq("ativado", false)
    .maybeSingle();

  if (!legado) return;

  const { data: profile } = await admin
    .from("profiles")
    .select("bio, cidade, estado, instagram_handle, instagram_followers, tiktok_handle, tiktok_followers, youtube_handle, youtube_subscribers")
    .eq("id", userId)
    .maybeSingle();

  const vazio = (v: unknown) => v === null || v === undefined || v === "";
  const patch: Record<string, unknown> = {};
  const herdar = (col: string, valor: unknown) => {
    if (!vazio(valor) && (!profile || vazio((profile as Record<string, unknown>)[col]))) {
      patch[col] = valor;
    }
  };

  herdar("bio", legado.bio);
  herdar("cidade", legado.cidade);
  herdar("estado", legado.estado);
  herdar("instagram_handle", legado.instagram);
  herdar("instagram_followers", legado.instagram_seguidores);
  herdar("tiktok_handle", legado.tiktok);
  herdar("tiktok_followers", legado.tiktok_seguidores);
  herdar("youtube_handle", legado.youtube);
  herdar("youtube_subscribers", legado.youtube_inscritos);

  if (Object.keys(patch).length > 0) {
    const { error: patchError } = await admin.from("profiles").update(patch).eq("id", userId);
    if (patchError) {
      console.error("[legado] herança de campos falhou", patchError.message);
    }
  }

  // Vínculo: a partir daqui o selo do creator na vitrine vira ✓ ATIVO e o
  // re-sync da importação nunca mais sobrescreve este registro.
  const { error: linkError } = await admin
    .from("creators_legado")
    .update({ ativado: true, ativado_em: new Date().toISOString(), profile_id: userId })
    .eq("id", legado.id)
    .eq("ativado", false);
  if (linkError) {
    console.error("[legado] vínculo do registro falhou", linkError.message);
  }
}
