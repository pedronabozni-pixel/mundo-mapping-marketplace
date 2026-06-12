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
  // Nas cobranças hospedadas carregamos o pedido.id aqui — serve de fallback
  // de casamento caso o asaas_payment_id não tenha sido gravado no pedido.
  externalReference?: string;
};

type AsaasWebhookBody = {
  id?: string; // ID do evento (evt_...) — base da idempotência
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

  // ── Idempotência por event.id (fail-open) ──────────────────────────────────
  // O unique de webhook_events.event_id garante que cada evento processa uma
  // única vez. Se a gravação falhar por CONFLITO (23505), o evento já foi
  // visto: responde 200 sem reprocessar. Se falhar por qualquer outro motivo
  // (ex.: indisponibilidade), loga e processa mesmo assim — a checagem por
  // status do pedido e o unique de vendas seguram a duplicata.
  const eventId = body?.id;
  if (eventId) {
    try {
      const { error: dedupError } = await createAdminClient()
        .from("webhook_events")
        .insert({
          event_id: eventId,
          event_type: event ?? null,
          payment_id: payment?.id ?? null,
        });
      if (dedupError) {
        if (dedupError.code === "23505") {
          return Response.json({ received: true, duplicate: true });
        }
        console.error("webhook asaas: falha ao registrar event_id (seguindo fail-open)", dedupError.message);
      }
    } catch (err) {
      console.error("webhook asaas: erro inesperado na deduplicação (seguindo fail-open)", err instanceof Error ? err.message : err);
    }
  }

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

const PEDIDO_FIELDS =
  "id, produto_id, empresa_id, creator_id, link_afiliado_id, cliente_email, cliente_nome, valor, comissao_creator, status";

async function handlePaymentApproved(payment: AsaasPayment) {
  const supabase = createAdminClient();

  let { data: pedido } = await supabase
    .from("pedidos")
    .select(PEDIDO_FIELDS)
    .eq("asaas_payment_id", payment.id)
    .maybeSingle();

  // Fallback: cobranças hospedadas carregam o pedido.id em externalReference.
  // Cobre o caso de o asaas_payment_id não ter sido gravado no pedido.
  if (!pedido && payment.externalReference) {
    ({ data: pedido } = await supabase
      .from("pedidos")
      .select(PEDIDO_FIELDS)
      .eq("id", payment.externalReference)
      .maybeSingle());
  }

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

  // Downgrade para o plano grátis: produtos com aprovação manual ficam
  // abertos na hora (grátis não pode exigir aprovação; espelha o trigger).
  await supabase
    .from("produtos")
    .update({ aprovacao_modo: "automatic" })
    .eq("empresa_id", profile.id)
    .eq("aprovacao_modo", "manual");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function registerAffiliateCommission(supabase: any, pedido: { id: string; produto_id: string; empresa_id: string; creator_id: string; link_afiliado_id: string | null; valor: number; comissao_creator: number }) {
  // A venda PRECISA estar registrada antes de qualquer incremento de comissão:
  // o unique vendas_pedido_id_unique é quem barra a duplicata em caso de
  // eventos concorrentes, então só incrementa quem conseguiu inserir a venda.
  const { error: vendaError } = await supabase.from("vendas").insert({
    pedido_id: pedido.id,
    produto_id: pedido.produto_id,
    empresa_id: pedido.empresa_id,
    creator_id: pedido.creator_id,
    link_afiliado_id: pedido.link_afiliado_id,
    valor: pedido.valor,
    comissao_creator: pedido.comissao_creator,
  });

  if (vendaError) {
    // 23505 (vendas_pedido_id_unique): outro evento já registrou esta venda
    // e o incremento correspondente — não duplicar comissão.
    if (vendaError.code !== "23505") {
      console.error("webhook asaas: falha ao registrar venda (comissão não incrementada)", vendaError.message);
    }
    return;
  }

  if (pedido.link_afiliado_id) {
    await supabase.rpc("incrementar_vendas_link", { p_link_id: pedido.link_afiliado_id });
  }
}
