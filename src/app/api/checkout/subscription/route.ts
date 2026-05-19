import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  findOrCreateCustomer,
  createCardSubscription,
  createPixSubscription,
  getSubscriptionPayments,
  getPixQrCode,
  todayISO,
  AsaasError,
} from "@/lib/asaas";

export const dynamic = "force-dynamic";

const PLAN_PRICES: Record<string, number> = {
  partner: 117,
  elite: 197,
};

const PLAN_NAMES: Record<string, string> = {
  partner: "Plano Partner — Mapping Partners",
  elite: "Plano Elite — Mapping Partners",
};

export async function POST(req: NextRequest) {
  let body: {
    plano: string;
    nome: string;
    email: string;
    cpfCnpj: string;
    senha?: string;
    billingType: "CREDIT_CARD" | "PIX";
    card?: {
      holderName: string;
      number: string;
      expiryMonth: string;
      expiryYear: string;
      ccv: string;
    };
    remoteIp?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { plano, nome, email, cpfCnpj, senha, billingType, card } = body;

  const value = PLAN_PRICES[plano];
  if (!value) return NextResponse.json({ error: "Plano inválido." }, { status: 400 });

  if (!nome?.trim() || !email?.trim() || !cpfCnpj?.trim()) {
    return NextResponse.json({ error: "Nome, e-mail e CPF/CNPJ são obrigatórios." }, { status: 400 });
  }

  // Detect logged-in user via session cookie
  const cookieStore = await cookies();
  const supabaseSession = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user: loggedInUser } } = await supabaseSession.auth.getUser();

  const supabase = createAdminClient();
  let userId: string;
  let newAccount = false;

  if (loggedInUser) {
    userId = loggedInUser.id;
  } else {
    if (!senha || senha.length < 8) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 8 caracteres." }, { status: 400 });
    }
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    });
    if (createErr) {
      const msg = createErr.message.toLowerCase().includes("already")
        ? "Este e-mail já está cadastrado. Faça login antes de assinar."
        : createErr.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    userId = created.user.id;
    newAccount = true;

    await supabase.from("profiles").upsert({
      id: userId,
      full_name: nome,
      email,
      user_type: "empresa",
      plano: "associate",
      plano_status: "ativo",
    }, { onConflict: "id" });
  }

  // Find or create Asaas customer
  let customer;
  try {
    customer = await findOrCreateCustomer({ name: nome, email, cpfCnpj });
  } catch (e) {
    const msg = e instanceof AsaasError ? e.message : "Erro ao criar cliente no gateway de pagamento.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const remoteIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    undefined;

  // ── CREDIT CARD ──────────────────────────────────────────────────────────────
  if (billingType === "CREDIT_CARD") {
    if (!card) return NextResponse.json({ error: "Dados do cartão ausentes." }, { status: 400 });

    let subscription;
    try {
      subscription = await createCardSubscription({
        customerId: customer.id,
        value,
        nextDueDate: todayISO(),
        description: PLAN_NAMES[plano],
        creditCard: card,
        holderInfo: { name: nome, email, cpfCnpj },
        remoteIp,
      });
    } catch (e) {
      if (e instanceof AsaasError) {
        return NextResponse.json({ error: e.message, code: e.code }, { status: 400 });
      }
      return NextResponse.json({ error: "Erro ao processar cartão." }, { status: 400 });
    }

    const validoAte = new Date();
    validoAte.setMonth(validoAte.getMonth() + 1);

    await supabase.from("profiles").update({
      plano,
      asaas_customer_id: customer.id,
      asaas_subscription_id: subscription.id,
      plano_valido_ate: validoAte.toISOString(),
      plano_status: "ativo",
    }).eq("id", userId);

    return NextResponse.json({ success: true, newAccount });
  }

  // ── PIX ───────────────────────────────────────────────────────────────────────
  let subscription;
  try {
    subscription = await createPixSubscription({
      customerId: customer.id,
      value,
      nextDueDate: todayISO(),
      description: PLAN_NAMES[plano],
    });
  } catch (e) {
    if (e instanceof AsaasError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar cobrança PIX." }, { status: 400 });
  }

  // Save pending subscription
  await supabase.from("profiles").update({
    asaas_customer_id: customer.id,
    asaas_subscription_id: subscription.id,
    plano_status: "pendente",
  }).eq("id", userId);

  // Retrieve first payment QR code
  let paymentId: string | null = null;
  let pixPayload: string | null = null;
  let pixQrCode: string | null = null;
  let pixExpirationDate: string | null = null;

  try {
    const paymentsRes = await getSubscriptionPayments(subscription.id);
    const firstPayment = paymentsRes.data?.[0];
    if (firstPayment) {
      paymentId = firstPayment.id;
      const qr = await getPixQrCode(firstPayment.id);
      pixPayload = qr.payload;
      pixQrCode = qr.encodedImage;
      pixExpirationDate = qr.expirationDate;
    }
  } catch {
    // QR retrieval can fail on sandbox; we still return subscriptionId for polling
  }

  return NextResponse.json({
    success: false,
    pendingPix: true,
    subscriptionId: subscription.id,
    paymentId,
    pixPayload,
    pixQrCode,
    pixExpirationDate,
    newAccount,
  });
}
