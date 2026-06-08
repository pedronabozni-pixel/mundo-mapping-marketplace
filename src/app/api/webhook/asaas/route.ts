import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeEmail } from "@/lib/normalize-email";

export const dynamic = "force-dynamic";

// ─── Asaas event types ────────────────────────────────────────────────────────

type AsaasPayment = {
  id: string;
  customer: string;
  value: number;
  netValue?: number;
  status: string;
  billingType: string;
  subscription?: string;
};

type AsaasWebhookBody = {
  event: string;
  payment: AsaasPayment;
};

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const token = req.headers.get("asaas-access-token");
  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: AsaasWebhookBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event, payment } = body;

  try {
    // Subscription payment events
    if (payment?.subscription) {
      switch (event) {
        case "PAYMENT_CONFIRMED":
        case "PAYMENT_RECEIVED":
          await handleSubscriptionRenewed(payment);
          break;
        case "PAYMENT_OVERDUE":
          await handleSubscriptionOverdue(payment);
          break;
        case "PAYMENT_DELETED":
        case "PAYMENT_REFUNDED":
          await handleSubscriptionCancelled(payment);
          break;
        default:
      }
      return Response.json({ received: true });
    }

    // One-off payment events
    switch (event) {
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED":
        await handlePaymentApproved(payment);
        break;
      case "PAYMENT_REFUSED":
      case "PAYMENT_DELETED":
        await handlePaymentRefused(payment);
        break;
      case "PAYMENT_REFUNDED":
      case "PAYMENT_CHARGEBACK_REQUESTED":
        await handlePaymentRefunded(payment);
        break;
      case "PAYMENT_OVERDUE":
        await handlePaymentOverdue(payment);
        break;
      default:
    }
  } catch (err) {
    // Always return 200 to Asaas — retries on non-2xx cause duplicate processing
  }

  return Response.json({ received: true });
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handlePaymentApproved(payment: AsaasPayment) {
  const supabase = createAdminClient();

  const { data: pedido } = await supabase
    .from("pedidos")
    .select("id, produto_id, empresa_id, creator_id, link_afiliado_id, cliente_email, cliente_nome, valor, comissao_creator, status")
    .eq("asaas_payment_id", payment.id)
    .maybeSingle();

  if (!pedido) {
    return;
  }

  if (pedido.status === "aprovado") {
    return;
  }

  await supabase
    .from("pedidos")
    .update({ status: "aprovado", atualizado_em: new Date().toISOString() })
    .eq("id", pedido.id);

  await grantDigitalAccess(supabase, pedido);

  if (pedido.creator_id) {
    await registerAffiliateCommission(supabase, pedido);
  }

}

async function handlePaymentRefused(payment: AsaasPayment) {
  const supabase = createAdminClient();

  await supabase
    .from("pedidos")
    .update({ status: "recusado", atualizado_em: new Date().toISOString() })
    .eq("asaas_payment_id", payment.id)
    .neq("status", "aprovado");

}

async function handlePaymentRefunded(payment: AsaasPayment) {
  const supabase = createAdminClient();

  const { data: pedido } = await supabase
    .from("pedidos")
    .select("id, produto_id, empresa_id, cliente_email")
    .eq("asaas_payment_id", payment.id)
    .maybeSingle();

  if (!pedido) return;

  await supabase
    .from("pedidos")
    .update({ status: "estornado", atualizado_em: new Date().toISOString() })
    .eq("id", pedido.id);

  // Revoke member access
  await supabase
    .from("acessos_membros")
    .update({ ativo: false })
    .eq("produto_id", pedido.produto_id)
    .eq("comprador_email", normalizeEmail(pedido.cliente_email));

}

async function handlePaymentOverdue(payment: AsaasPayment) {
  const supabase = createAdminClient();

  await supabase
    .from("pedidos")
    .update({ status: "vencido", atualizado_em: new Date().toISOString() })
    .eq("asaas_payment_id", payment.id)
    .eq("status", "pendente");

}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function grantDigitalAccess(supabase: any, pedido: { produto_id: string; empresa_id: string; id: string; cliente_email: string; cliente_nome: string }) {
  const { data: produto } = await supabase
    .from("produtos")
    .select("tipo_entregavel")
    .eq("id", pedido.produto_id)
    .maybeSingle();

  if (produto?.tipo_entregavel === "digital" || produto?.tipo_entregavel === "curso") {
    await supabase.from("acessos_membros").upsert(
      {
        empresa_id: pedido.empresa_id,
        produto_id: pedido.produto_id,
        pedido_id: pedido.id,
        comprador_email: normalizeEmail(pedido.cliente_email),
        comprador_nome: pedido.cliente_nome,
        ativo: true,
      },
      { onConflict: "produto_id,comprador_email" }
    );
  }
}

// ─── Subscription handlers ────────────────────────────────────────────────────

async function handleSubscriptionRenewed(payment: AsaasPayment) {
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, plano")
    .eq("asaas_subscription_id", payment.subscription)
    .maybeSingle();

  if (!profile) {
    return;
  }

  const validoAte = new Date();
  validoAte.setMonth(validoAte.getMonth() + 1);

  await supabase.from("profiles").update({
    plano_valido_ate: validoAte.toISOString(),
    plano_status: "ativo",
  }).eq("id", profile.id);

}

async function handleSubscriptionOverdue(payment: AsaasPayment) {
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("asaas_subscription_id", payment.subscription)
    .maybeSingle();

  if (!profile) return;

  await supabase.from("profiles").update({ plano_status: "inadimplente" }).eq("id", profile.id);

}

async function handleSubscriptionCancelled(payment: AsaasPayment) {
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("asaas_subscription_id", payment.subscription)
    .maybeSingle();

  if (!profile) return;

  await supabase.from("profiles").update({
    plano: "associate",
    asaas_subscription_id: null,
    plano_valido_ate: null,
    plano_status: "ativo",
  }).eq("id", profile.id);

}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function registerAffiliateCommission(supabase: any, pedido: { id: string; produto_id: string; empresa_id: string; creator_id: string; link_afiliado_id: string | null; valor: number; comissao_creator: number }) {
  await supabase.from("vendas").insert({
    pedido_id: pedido.id,
    produto_id: pedido.produto_id,
    empresa_id: pedido.empresa_id,
    creator_id: pedido.creator_id,
    link_afiliado_id: pedido.link_afiliado_id,
    valor: pedido.valor,
    comissao_creator: pedido.comissao_creator,
  });

  if (pedido.link_afiliado_id) {
    await supabase.rpc("incrementar_vendas_link", { p_link_id: pedido.link_afiliado_id });
  }
}
