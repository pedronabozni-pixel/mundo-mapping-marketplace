import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPaymentStatus } from "@/lib/asaas";

export const dynamic = "force-dynamic";

// ─── GET handler ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    // 1. Read payment_id from query params
    const { searchParams } = req.nextUrl;
    const paymentId = searchParams.get("payment_id");

    if (!paymentId) {
      return NextResponse.json(
        { paid: false, error: "payment_id é obrigatório." },
        { status: 400 }
      );
    }

    // 2. Get payment status from Asaas
    const payment = await getPaymentStatus(paymentId);
    const { status } = payment;

    // 3. If paid, update pedido and return paid: true
    if (status === "RECEIVED" || status === "CONFIRMED") {
      const supabase = await createClient();

      await supabase
        .from("pedidos")
        .update({ status: "aprovado", atualizado_em: new Date().toISOString() })
        .eq("asaas_payment_id", paymentId);

      return NextResponse.json({ paid: true, status });
    }

    // 4. Otherwise return paid: false
    return NextResponse.json({ paid: false, status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno.";
    return NextResponse.json({ paid: false, error: message }, { status: 500 });
  }
}
