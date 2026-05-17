// MODO SIMULADO — sem integração Asaas.
// Para ativar o Asaas: importar os helpers de @/lib/asaas e substituir
// o bloco "// TODO: Asaas" abaixo pelas chamadas reais.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { produto_id, empresa_id, ref, valor, forma_pagamento, parcelas, cliente } = body;

    if (
      !produto_id || !empresa_id || !valor || !forma_pagamento ||
      !cliente?.nome || !cliente?.email || !cliente?.cpf
    ) {
      return NextResponse.json({ ok: false, error: "Dados incompletos." }, { status: 400 });
    }

    const supabase = await createClient();

    // Resolve link de afiliado
    let link_afiliado_id: string | null = null;
    let creator_id: string | null = null;
    let comissao_creator = 0;

    if (ref) {
      const { data: link } = await supabase
        .from("links_afiliados")
        .select("id, creator_id, comissao_tipo, comissao_valor")
        .eq("codigo", ref)
        .eq("ativo", true)
        .maybeSingle();

      if (link) {
        link_afiliado_id = link.id;
        creator_id = link.creator_id;
        comissao_creator =
          link.comissao_tipo === "percent"
            ? (Number(valor) * Number(link.comissao_valor)) / 100
            : Number(link.comissao_valor);
      }
    }

    // TODO: Asaas — criar customer + payment aqui antes do insert

    const { data: pedido, error } = await supabase
      .from("pedidos")
      .insert({
        produto_id,
        empresa_id,
        creator_id,
        link_afiliado_id,
        cliente_nome: cliente.nome,
        cliente_email: cliente.email,
        cliente_cpf: cliente.cpf,
        cliente_telefone: cliente.telefone ?? null,
        cliente_endereco: cliente.endereco ?? null,
        valor: Number(valor),
        comissao_creator,
        taxa_mapping: 0,
        parcelas: parcelas ?? 1,
        forma_pagamento,
        status: "simulado",
      })
      .select("id")
      .single();

    if (error || !pedido) {
      console.error("[checkout/payment]", error);
      return NextResponse.json({ ok: false, error: "Erro ao salvar pedido." }, { status: 500 });
    }

    // Concede acesso à área de membros automaticamente
    const { data: produto } = await supabase
      .from("produtos")
      .select("tipo_entregavel")
      .eq("id", produto_id)
      .maybeSingle();

    if (produto?.tipo_entregavel === "digital" || produto?.tipo_entregavel === "curso") {
      await supabase
        .from("acessos_membros")
        .upsert(
          {
            empresa_id,
            produto_id,
            pedido_id: pedido.id,
            comprador_email: cliente.email.toLowerCase().trim(),
            comprador_nome: cliente.nome,
            ativo: true,
          },
          { onConflict: "produto_id,comprador_email" }
        );
    }

    return NextResponse.json({ ok: true, pedido_id: pedido.id });
  } catch (err) {
    console.error("[checkout/payment]", err);
    return NextResponse.json({ ok: false, error: "Erro interno." }, { status: 500 });
  }
}
