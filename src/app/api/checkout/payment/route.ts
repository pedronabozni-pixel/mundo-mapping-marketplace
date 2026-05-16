import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  findOrCreateCustomer,
  createCardPayment,
  createPixPayment,
  getPixQrCode,
} from "@/lib/asaas";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientePayload {
  nome: string;
  email: string;
  cpf: string;
  telefone?: string;
  endereco?: {
    cep?: string;
    rua?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
  };
}

interface CartaoPayload {
  numero: string;
  nome: string;
  validade: string; // MM/AA
  cvv: string;
}

interface PaymentRequestBody {
  produto_id: string;
  produto_nome: string;
  empresa_id: string;
  ref?: string;
  valor: number;
  forma_pagamento: "cartao" | "pix";
  parcelas: number;
  cliente: ClientePayload;
  cartao?: CartaoPayload;
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: PaymentRequestBody = await req.json();

    // 1. Validate required fields
    const { produto_id, empresa_id, valor, forma_pagamento, cliente } = body;

    if (
      !produto_id ||
      !empresa_id ||
      !valor ||
      !forma_pagamento ||
      !cliente?.nome ||
      !cliente?.email ||
      !cliente?.cpf
    ) {
      return NextResponse.json(
        { ok: false, error: "Campos obrigatórios ausentes." },
        { status: 400 }
      );
    }

    if (!["cartao", "pix"].includes(forma_pagamento)) {
      return NextResponse.json(
        { ok: false, error: "forma_pagamento inválida. Use 'cartao' ou 'pix'." },
        { status: 400 }
      );
    }

    if (forma_pagamento === "cartao" && !body.cartao) {
      return NextResponse.json(
        { ok: false, error: "Dados do cartão são obrigatórios para pagamento com cartão." },
        { status: 400 }
      );
    }

    // 2. Get remote IP
    const remoteIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // 3. Find or create Asaas customer
    const customer = await findOrCreateCustomer({
      name: cliente.nome,
      email: cliente.email,
      cpfCnpj: cliente.cpf,
      phone: cliente.telefone,
    });

    // 4 & 5. Create payment based on forma_pagamento
    let asaasPaymentId: string;
    let paymentStatus: string;
    let pixData: { qrCode: string; payload: string; paymentId: string } | undefined;

    if (forma_pagamento === "cartao") {
      const cartao = body.cartao!;

      // Parse validade MM/AA → expiryMonth, expiryYear
      const [rawMonth, rawYear] = cartao.validade.split("/");
      const expiryMonth = rawMonth.trim();
      const rawYearTrimmed = rawYear.trim();
      const expiryYear =
        rawYearTrimmed.length === 2 ? `20${rawYearTrimmed}` : rawYearTrimmed;

      const payment = await createCardPayment({
        customerId: customer.id,
        value: valor,
        installmentCount: body.parcelas ?? 1,
        creditCard: {
          holderName: cartao.nome,
          number: cartao.numero,
          expiryMonth,
          expiryYear,
          ccv: cartao.cvv,
        },
        creditCardHolderInfo: {
          name: cliente.nome,
          email: cliente.email,
          cpfCnpj: cliente.cpf,
          mobilePhone: cliente.telefone ?? "",
          postalCode: cliente.endereco?.cep ?? "",
          addressNumber: cliente.endereco?.numero ?? "",
        },
        remoteIp,
      });

      // 6. Check for Asaas errors
      if (payment.errors && payment.errors.length > 0) {
        return NextResponse.json(
          { ok: false, error: payment.errors[0].description },
          { status: 422 }
        );
      }

      asaasPaymentId = payment.id;
      paymentStatus = payment.status;
    } else {
      // PIX
      const dueDate = new Date().toISOString().split("T")[0];

      const payment = await createPixPayment({
        customerId: customer.id,
        value: valor,
        dueDate,
        description: body.produto_nome,
      });

      // 6. Check for Asaas errors
      if (payment.errors && payment.errors.length > 0) {
        return NextResponse.json(
          { ok: false, error: payment.errors[0].description },
          { status: 422 }
        );
      }

      asaasPaymentId = payment.id;
      paymentStatus = payment.status;

      const qrCode = await getPixQrCode(payment.id);
      pixData = {
        qrCode: qrCode.encodedImage,
        payload: qrCode.payload,
        paymentId: payment.id,
      };
    }

    // 7 & 8. Look up affiliate link and calculate commission
    const supabase = await createClient();

    let linkAfiliadoId: string | null = null;
    let creatorId: string | null = null;
    let comissaoCreator = 0;

    if (body.ref) {
      const { data: link } = await supabase
        .from("links_afiliados")
        .select("id, creator_id, comissao_tipo, comissao_valor")
        .eq("codigo", body.ref)
        .single();

      if (link) {
        linkAfiliadoId = link.id;
        creatorId = link.creator_id;

        if (link.comissao_tipo === "percent") {
          comissaoCreator = (valor * link.comissao_valor) / 100;
        } else if (link.comissao_tipo === "fixed") {
          comissaoCreator = link.comissao_valor;
        }
      }
    }

    // 9. Insert pedido into Supabase
    const pedidoStatus =
      forma_pagamento === "cartao" && paymentStatus === "CONFIRMED"
        ? "aprovado"
        : forma_pagamento === "cartao"
        ? "aprovado"
        : "pendente";

    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .insert({
        produto_id,
        empresa_id,
        ...(creatorId ? { creator_id: creatorId } : {}),
        ...(linkAfiliadoId ? { link_afiliado_id: linkAfiliadoId } : {}),
        cliente_nome: cliente.nome,
        cliente_email: cliente.email,
        cliente_cpf: cliente.cpf,
        cliente_telefone: cliente.telefone ?? null,
        cliente_endereco: cliente.endereco ?? null,
        valor,
        comissao_creator: comissaoCreator,
        taxa_mapping: 0, // TODO: implement split
        parcelas: body.parcelas ?? 1,
        forma_pagamento,
        status: pedidoStatus,
        asaas_payment_id: asaasPaymentId,
        asaas_customer_id: customer.id,
      })
      .select("id")
      .single();

    if (pedidoError || !pedido) {
      return NextResponse.json(
        { ok: false, error: "Erro ao salvar pedido: " + (pedidoError?.message ?? "unknown") },
        { status: 500 }
      );
    }

    // 10. Return response
    if (forma_pagamento === "cartao") {
      return NextResponse.json({ ok: true, pedido_id: pedido.id, status: "aprovado" });
    }

    return NextResponse.json({
      ok: true,
      pedido_id: pedido.id,
      status: "pendente",
      pix: pixData,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
