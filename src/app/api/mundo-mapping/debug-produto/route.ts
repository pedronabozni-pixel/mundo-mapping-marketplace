/**
 * ROTA DE DIAGNÓSTICO TEMPORÁRIA — remover após resolver o problema de criação.
 * Acesse em /api/mundo-mapping/debug-produto enquanto logado como empresa.
 * Retorna JSON com o resultado do INSERT de teste (limpo automaticamente se sucesso).
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  // 1. Verificar sessão
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ step: "auth", ok: false, error: authError?.message ?? "Sem sessão ativa" });
  }

  const slug = `debug-diag-${Date.now()}`;

  // 2. Tentar INSERT mínimo
  const { error: minErr } = await supabase.from("produtos").insert({
    empresa_id: user.id,
    nome: "Debug Mínimo",
    slug: `${slug}-min`,
    preco: 0,
    comissao_tipo: "percent",
    comissao_valor: 0,
    garantia_dias: 7,
  });

  if (minErr) {
    return NextResponse.json({
      step: "insert_minimo",
      ok: false,
      user_id: user.id,
      error: { code: minErr.code, message: minErr.message, details: minErr.details, hint: minErr.hint },
      instrucoes: "Execute o SQL de permissões no Supabase SQL Editor (veja commit 43693a2)",
    });
  }

  // Limpa INSERT mínimo
  await supabase.from("produtos").delete().eq("slug", `${slug}-min`);

  // 3. Tentar INSERT completo (payload igual ao product-store.ts)
  const fullRow = {
    empresa_id: user.id, empresa_nome: "Debug", nome: "Debug Completo", marca: "Debug",
    categoria: "Infoproduto | Ebook", descricao: "", url_produto: "https://debug.com",
    preco: 99.9, comissao_tipo: "percent", comissao_valor: 20, comissao_base: "gross",
    garantia_dias: 14, liberacao_dias: 14, payout_mode: "platform_ledger",
    attribution_model: "last_click", attribution_window_dias: 7, cupom_habilitado: true,
    aprovacao_modo: "manual", visivel_shopping: false, status: "draft", publico: "",
    score_minimo: 70, seguidores_minimo: 5000, regioes_permitidas: "Brasil",
    whitelist_only: false, exige_social_proof: false, materiais_resumo: "",
    capa_modo: "link", capa_url: "", capa_nome: "", promo_modo: "link",
    promo_url: "", promo_nome: "", checkout_cor: "#dc2626", checkout_banner_modo: "link",
    checkout_banner_url: "", checkout_banner_nome: "", checkout_headline: "",
    checkout_subheadline: "", checkout_cta: "Comprar agora", checkout_garantia: "",
    checkout_suporte: "", checkout_highlights: "", suporte_email: "debug@debug.com",
    logistica_modo: "digital", estoque_requerido: false, frete_gerido_por: "na",
    reserva_requerida: false, politica_no_show: "", slug: `${slug}-full`,
  };

  const { data: fullData, error: fullErr } = await supabase
    .from("produtos").insert(fullRow).select("id, slug").single();

  if (fullErr) {
    return NextResponse.json({
      step: "insert_completo",
      ok: false,
      user_id: user.id,
      insert_minimo: "OK",
      error: { code: fullErr.code, message: fullErr.message, details: fullErr.details, hint: fullErr.hint },
    });
  }

  // Limpa INSERT completo
  await supabase.from("produtos").delete().eq("id", fullData.id);

  return NextResponse.json({
    ok: true,
    user_id: user.id,
    message: "INSERT mínimo e completo funcionaram. Produto de teste criado e removido com sucesso.",
    proximos_passos: "Se o produto ainda não aparece na UI, o problema é no frontend (userId null no store).",
  });
}
