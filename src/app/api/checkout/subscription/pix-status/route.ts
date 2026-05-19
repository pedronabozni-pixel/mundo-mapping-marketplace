import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentStatus, isPaymentApproved } from "@/lib/asaas";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get("paymentId");
  const plano = searchParams.get("plano");

  if (!paymentId || !plano) {
    return NextResponse.json({ error: "Parâmetros ausentes." }, { status: 400 });
  }

  let payment;
  try {
    payment = await getPaymentStatus(paymentId);
  } catch {
    return NextResponse.json({ error: "Erro ao consultar status." }, { status: 400 });
  }

  const approved = isPaymentApproved(payment.status);

  if (approved) {
    // Activate plan — find user by subscription payment (via asaas_subscription_id stored earlier)
    const cookieStore = await cookies();
    const supabaseSession = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabaseSession.auth.getUser();

    if (user) {
      const supabase = createAdminClient();
      const validoAte = new Date();
      validoAte.setMonth(validoAte.getMonth() + 1);

      await supabase.from("profiles").update({
        plano,
        plano_valido_ate: validoAte.toISOString(),
        plano_status: "ativo",
      }).eq("id", user.id);
    }
  }

  return NextResponse.json({ approved, status: payment.status });
}
