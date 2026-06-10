import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeEmail } from "@/lib/normalize-email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  findOrCreateCustomer,
  createHostedCardPayment,
  createPixPayment,
  getPixQrCode,
  mapAsaasCode,
  AsaasError,
} from "@/lib/asaas";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`payment:${ip}`, 10, 60000);
  if (rl.limited) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente em instantes." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  try {
    const body = await req.json();
    const {
      produto_id, produto_nome, produto_slug, empresa_id, ref, valor,
      forma_pagamento, parcelas, cliente,
      order_bump_aceito, order_bump_produto_id, order_bump_valor,
      cupom_codigo, cupom_desconto,
    } = body;

    if (
      !produto_id || !empresa_id || !valor || !forma_pagamento ||
      !cliente?.nome || !cliente?.email || !cliente?.cpf
    ) {
      return NextResponse.json({ ok: false, error: "Dados incompletos." }, { status: 400 });
    }

    const clienteEmail = normalizeEmail(cliente.email);

    const supabase = await createClient();

    // ── Affiliate link resolution ──────────────────────────────────────────────
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

    const taxa_mapping = Math.round((Number(valor) * 2) / 100 * 100) / 100;

    // ── Re-validate cupom server-side — client value is untrusted ─────────────
    let validatedCupomDesconto = 0;
    if (cupom_codigo) {
      const { data: cupom } = await supabase
        .from("cupons")
        .select("valor, limit_usos, usos_realizados, validade, produto_id")
        .eq("produto_id", produto_id)
        .ilike("codigo", cupom_codigo)
        .eq("ativo", true)
        .maybeSingle();
      const notExpired = !cupom?.validade || new Date(cupom.validade) > new Date();
      const notExhausted = !cupom?.limit_usos || (cupom.usos_realizados ?? 0) < cupom.limit_usos;
      if (cupom && notExpired && notExhausted) {
        validatedCupomDesconto = Math.round((Number(valor) * Number(cupom.valor)) / 100 * 100) / 100;
      }
    }

    // ── upsell_1click (aceite pós-checkout, sem nova cobrança separada) ─────────
    if (forma_pagamento === "upsell_1click") {
      const { data: pedido, error } = await supabase
        .from("pedidos")
        .insert({
          produto_id, empresa_id, creator_id, link_afiliado_id,
          cliente_nome: cliente.nome, cliente_email: clienteEmail,
          cliente_cpf: cliente.cpf, cliente_telefone: cliente.telefone ?? null,
          cliente_endereco: cliente.endereco ?? null,
          valor: Number(valor), comissao_creator, taxa_mapping: 0,
          parcelas: 1, forma_pagamento, status: "aprovado",
          order_bump_aceito: false, order_bump_produto_id: null, order_bump_valor: 0,
          upsell_aceito: true, upsell_produto_id: produto_id, upsell_valor: Number(valor),
          cupom_codigo: null, cupom_desconto: 0,
        })
        .select("id")
        .single();

      if (error || !pedido) return NextResponse.json({ ok: false, error: "Erro ao salvar pedido." }, { status: 500 });
      return NextResponse.json({ ok: true, pedido_id: pedido.id });
    }

    // ── Asaas: find or create customer ────────────────────────────────────────
    let asaasCustomerId: string;
    try {
      const customer = await findOrCreateCustomer({
        name: cliente.nome,
        email: clienteEmail,
        cpfCnpj: cliente.cpf,
        phone: cliente.telefone,
      });
      asaasCustomerId = customer.id;
    } catch (err) {
      return NextResponse.json({ ok: false, error: "Não foi possível processar o cliente." }, { status: 502 });
    }

    const remoteIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      undefined;

    // ── Cartão de crédito (tela hospedada do Asaas — PCI-mínimo) ───────────────
    // O cartão NÃO é processado aqui: criamos a cobrança sem dados de cartão,
    // o Asaas devolve um invoiceUrl, e o comprador conclui o pagamento na tela
    // segura do Asaas. O acesso é liberado depois pelo webhook (PAYMENT_CONFIRMED).
    if (forma_pagamento === "cartao") {
      // (a) Pedido entra como "pendente" — nunca "aprovado" antes do pagamento.
      const { data: pedido, error } = await supabase
        .from("pedidos")
        .insert({
          produto_id, empresa_id, creator_id, link_afiliado_id,
          cliente_nome: cliente.nome, cliente_email: clienteEmail,
          cliente_cpf: cliente.cpf, cliente_telefone: cliente.telefone ?? null,
          cliente_endereco: cliente.endereco ?? null,
          valor: Number(valor), comissao_creator, taxa_mapping,
          parcelas: Number(parcelas ?? 1), forma_pagamento, status: "pendente",
          asaas_customer_id: asaasCustomerId,
          order_bump_aceito: order_bump_aceito ?? false,
          order_bump_produto_id: order_bump_aceito ? (order_bump_produto_id ?? null) : null,
          order_bump_valor: order_bump_aceito ? Number(order_bump_valor ?? 0) : 0,
          upsell_aceito: false, upsell_produto_id: null, upsell_valor: 0,
          cupom_codigo: cupom_codigo ?? null,
          cupom_desconto: validatedCupomDesconto,
        })
        .select("id")
        .single();

      if (error || !pedido) {
        return NextResponse.json({ ok: false, error: "Erro ao salvar pedido." }, { status: 500 });
      }

      // (b) Cria a cobrança hospedada. successUrl absoluta: usa env quando houver,
      // senão a origem da própria requisição (sempre correta em produção).
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? req.nextUrl.origin;
      const successUrl =
        `${baseUrl}/checkout/${encodeURIComponent(produto_slug ?? "")}/obrigado?pedido=${pedido.id}`;

      let asaasPayment;
      try {
        asaasPayment = await createHostedCardPayment({
          customerId: asaasCustomerId,
          value: Number(valor),
          description: produto_nome ? `Compra — ${produto_nome}` : "Compra",
          externalReference: pedido.id,
          successUrl,
          remoteIp,
        });
      } catch (err) {
        // Cobrança não criada: remove o pedido órfão para não deixar lixo pendente.
        await supabase.from("pedidos").delete().eq("id", pedido.id);
        const msg = err instanceof AsaasError
          ? mapAsaasCode(err.code)
          : "Erro ao iniciar pagamento. Tente novamente.";
        return NextResponse.json({ ok: false, error: msg }, { status: 402 });
      }

      // (c) Grava o asaas_payment_id — é por ele que o webhook casa o pagamento
      // e libera o acesso. Sem isso, o acesso nunca seria liberado.
      await supabase
        .from("pedidos")
        .update({ asaas_payment_id: asaasPayment.id })
        .eq("id", pedido.id);

      if (cupom_codigo) await incrementCupomUso(supabase, produto_id, cupom_codigo);

      // (d) Front redireciona para a tela hospedada do Asaas.
      return NextResponse.json({
        ok: true,
        pedido_id: pedido.id,
        invoiceUrl: asaasPayment.invoiceUrl,
      });
    }

    // ── PIX ───────────────────────────────────────────────────────────────────
    if (forma_pagamento === "pix") {
      let asaasPayment;
      let qrCode;
      try {
        asaasPayment = await createPixPayment({
          customerId: asaasCustomerId,
          value: Number(valor),
        });
        qrCode = await getPixQrCode(asaasPayment.id);
      } catch (err) {
        return NextResponse.json({ ok: false, error: "Não foi possível gerar o PIX. Tente novamente." }, { status: 502 });
      }

      const { data: pedido, error } = await supabase
        .from("pedidos")
        .insert({
          produto_id, empresa_id, creator_id, link_afiliado_id,
          cliente_nome: cliente.nome, cliente_email: clienteEmail,
          cliente_cpf: cliente.cpf, cliente_telefone: cliente.telefone ?? null,
          cliente_endereco: cliente.endereco ?? null,
          valor: Number(valor), comissao_creator, taxa_mapping,
          parcelas: 1, forma_pagamento, status: "pendente",
          asaas_payment_id: asaasPayment.id,
          asaas_customer_id: asaasCustomerId,
          order_bump_aceito: order_bump_aceito ?? false,
          order_bump_produto_id: order_bump_aceito ? (order_bump_produto_id ?? null) : null,
          order_bump_valor: order_bump_aceito ? Number(order_bump_valor ?? 0) : 0,
          upsell_aceito: false, upsell_produto_id: null, upsell_valor: 0,
          cupom_codigo: cupom_codigo ?? null,
          cupom_desconto: validatedCupomDesconto,
        })
        .select("id")
        .single();

      if (error || !pedido) {
        return NextResponse.json({ ok: false, error: "Erro ao salvar pedido." }, { status: 500 });
      }

      if (cupom_codigo) await incrementCupomUso(supabase, produto_id, cupom_codigo);

      return NextResponse.json({
        ok: true,
        pedido_id: pedido.id,
        asaas_payment_id: asaasPayment.id,
        qr_code_base64: qrCode.encodedImage,
        pix_code: qrCode.payload,
      });
    }

    return NextResponse.json({ ok: false, error: "Forma de pagamento inválida." }, { status: 400 });

  } catch (err) {
    return NextResponse.json({ ok: false, error: "Erro interno." }, { status: 500 });
  }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function incrementCupomUso(supabase: any, produto_id: string, cupom_codigo: string) {
  const { data: row } = await supabase
    .from("cupons")
    .select("id, usos_realizados")
    .eq("produto_id", produto_id)
    .ilike("codigo", cupom_codigo)
    .maybeSingle();
  if (row) {
    await supabase.from("cupons").update({ usos_realizados: row.usos_realizados + 1 }).eq("id", row.id);
  }
}
