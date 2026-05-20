import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPaymentStatus, isPaymentApproved, AsaasError } from "@/lib/asaas";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const paymentId = searchParams.get("payment_id");
  const pedidoId = searchParams.get("pedido_id");

  if (!paymentId || !pedidoId) {
    return NextResponse.json({ pago: false, error: "Parâmetros ausentes." }, { status: 400 });
  }

  try {
    const payment = await getPaymentStatus(paymentId);

    if (!isPaymentApproved(payment.status)) {
      return NextResponse.json({ pago: false, status: payment.status });
    }

    const supabase = await createClient();

    const { data: pedido } = await supabase
      .from("pedidos")
      .update({ status: "aprovado", atualizado_em: new Date().toISOString() })
      .eq("id", pedidoId)
      .eq("asaas_payment_id", paymentId)
      .eq("status", "pendente")
      .select("produto_id, empresa_id, cliente_email, cliente_nome")
      .single();

    if (pedido) {
      await grantDigitalAccess(supabase, pedido.produto_id, pedido.empresa_id, pedidoId, {
        email: pedido.cliente_email,
        nome: pedido.cliente_nome,
      });
    }

    return NextResponse.json({ pago: true });
  } catch (err) {
    return NextResponse.json({ pago: false, error: "Erro ao verificar pagamento." }, { status: 502 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function grantDigitalAccess(supabase: any, produto_id: string, empresa_id: string, pedido_id: string, cliente: { email: string; nome: string }) {
  const { data: produto } = await supabase
    .from("produtos")
    .select("tipo_entregavel")
    .eq("id", produto_id)
    .maybeSingle();

  if (produto?.tipo_entregavel === "digital" || produto?.tipo_entregavel === "curso") {
    await supabase.from("acessos_membros").upsert(
      {
        empresa_id,
        produto_id,
        pedido_id,
        comprador_email: cliente.email.toLowerCase().trim(),
        comprador_nome: cliente.nome,
        ativo: true,
      },
      { onConflict: "produto_id,comprador_email" }
    );
  }
}
