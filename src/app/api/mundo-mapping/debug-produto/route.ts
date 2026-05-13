/**
 * Rota de diagnóstico — acesse em /api/mundo-mapping/debug-produto enquanto logado como empresa.
 * Compara as colunas esperadas pelo código com as que existem na tabela produtos.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const EXPECTED_COLUMNS = [
  "id", "slug", "empresa_id", "empresa_nome", "nome", "marca", "categoria",
  "descricao", "url_produto", "preco", "comissao_tipo", "comissao_valor",
  "comissao_base", "garantia_dias", "liberacao_dias", "payout_mode",
  "attribution_model", "attribution_window_dias", "cupom_habilitado",
  "aprovacao_modo", "visivel_shopping", "status", "publico", "score_minimo",
  "seguidores_minimo", "regioes_permitidas", "whitelist_only",
  "exige_social_proof", "materiais_resumo", "capa_modo", "capa_url",
  "capa_nome", "promo_modo", "promo_url", "promo_nome", "checkout_cor",
  "checkout_banner_modo", "checkout_banner_url", "checkout_banner_nome",
  "checkout_headline", "checkout_subheadline", "checkout_cta",
  "checkout_garantia", "checkout_suporte", "checkout_highlights",
  "suporte_email", "logistica_modo", "estoque_requerido", "frete_gerido_por",
  "reserva_requerida", "politica_no_show", "criado_em", "atualizado_em",
];

export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ ok: false, error: "Sem sessão ativa" });
  }

  // Descobre as colunas que existem via SELECT vazio
  const { data: sample, error: sampleErr } = await supabase
    .from("produtos")
    .select("*")
    .limit(0);

  if (sampleErr) {
    return NextResponse.json({
      ok: false,
      step: "select_schema",
      error: { code: sampleErr.code, message: sampleErr.message },
      hint: "A tabela produtos pode não existir. Execute o SQL em supabase/migrations/20260513_produtos_schema_completo.sql",
    });
  }

  // Testa INSERT mínimo para verificar permissões
  const slug = `diag-${Date.now()}`;
  const { error: insertErr } = await supabase.from("produtos").insert({
    empresa_id: user.id,
    nome: "Diagnóstico",
    slug,
    preco: 0,
    comissao_tipo: "percent",
    comissao_valor: 0,
    garantia_dias: 7,
  });

  if (insertErr) {
    const missing = insertErr.message.match(/column "([^"]+)" of relation/)?.[1];
    return NextResponse.json({
      ok: false,
      step: "insert_minimo",
      user_id: user.id,
      error: { code: insertErr.code, message: insertErr.message, hint: insertErr.hint },
      coluna_faltando: missing ?? "veja message acima",
      acao: "Execute supabase/migrations/20260513_produtos_schema_completo.sql no SQL Editor do Supabase",
    });
  }

  await supabase.from("produtos").delete().eq("slug", slug);

  return NextResponse.json({
    ok: true,
    user_id: user.id,
    message: "INSERT funcionou. Se o produto ainda não aparece na UI, o problema é no frontend.",
    expected_columns: EXPECTED_COLUMNS.length,
  });
}
