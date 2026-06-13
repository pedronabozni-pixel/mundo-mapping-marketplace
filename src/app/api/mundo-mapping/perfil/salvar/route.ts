import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Salva o perfil do PRÓPRIO usuário (empresa ou influenciador) via admin client.
//
// SEGURANÇA: o admin client ignora RLS, então o id do perfil vem SOMENTE da
// sessão server-side — nunca do corpo da requisição. Qualquer `id`/`email`
// enviado no body é descartado (não está na whitelist). Assim ninguém edita
// o perfil de outro.
//
// Só colunas existentes em `profiles` e nesta whitelist são gravadas.
const ALLOWED = new Set<string>([
  // comuns / empresa
  "full_name", "phone", "celular", "avatar_url", "logo_url",
  "cartao_cnpj_url", "comprovante_endereco_url", "doc_identificacao_url",
  "cpf_cnpj", "razao_social", "segmento", "receber_propostas",
  "cep", "endereco", "numero", "complemento", "estado", "cidade", "bairro",
  "nome_responsavel", "cargo_responsavel", "rg_responsavel", "cpf_responsavel",
  "data_nascimento", "email_responsavel",
  // influenciador
  "city", "state", "bio", "niche", "wallet_id",
  "instagram_handle", "instagram_followers",
  "tiktok_handle", "tiktok_followers",
  "youtube_handle", "youtube_subscribers",
  "twitter_handle", "twitter_followers",
]);

const NUMERIC = new Set<string>([
  "instagram_followers", "tiktok_followers", "youtube_subscribers", "twitter_followers",
]);
const DATE = new Set<string>(["data_nascimento"]);

export async function POST(req: Request) {
  // Usuário autenticado pela sessão — única fonte do id do perfil.
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Sessão expirada. Faça login novamente." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body ?? {})) {
    if (!ALLOWED.has(key)) continue; // ignora id/email/qualquer campo fora da whitelist
    if (NUMERIC.has(key)) {
      if (value === null || value === undefined || value === "") {
        patch[key] = null;
      } else {
        const n = Number(value);
        patch[key] = Number.isFinite(n) ? Math.trunc(n) : null;
      }
    } else if (DATE.has(key)) {
      patch[key] = value ? value : null;
    } else {
      patch[key] = value === undefined ? null : value;
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nenhum campo válido para salvar." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .upsert({ id: user.id, ...patch }, { onConflict: "id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
