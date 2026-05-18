import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── Asaas event types ────────────────────────────────────────────────────────

type AsaasPayment = {
  id: string;
  customer: string;
  value: number;
  netValue?: number;
  status: string;
  billingType: string;
};

type AsaasWebhookBody = {
  event: string;
  payment: AsaasPayment;
};

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const token = req.headers.get("asaas-access-token");
  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    console.warn("[webhook/asaas] token inválido recebido");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: AsaasWebhookBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event, payment } = body;
  console.log(`[webhook/asaas] ${event} — payment: ${payment?.id}`);

  try {
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
        console.log(`[webhook/asaas] evento ignorado: ${event}`);
    }
  } catch (err) {
    // Always return 200 to Asaas — retries on non-2xx cause duplicate processing
    console.error(`[webhook/asaas] erro ao processar ${event}:`, err);
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
    console.warn(`[webhook/asaas] pedido não encontrado para payment_id: ${payment.id}`);
    return;
  }

  if (pedido.status === "aprovado") {
    console.log(`[webhook/asaas] pedido ${pedido.id} já aprovado, ignorando`);
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

  console.log(`[webhook/asaas] pedido ${pedido.id} aprovado`);
}

async function handlePaymentRefused(payment: AsaasPayment) {
  const supabase = createAdminClient();

  await supabase
    .from("pedidos")
    .update({ status: "recusado", atualizado_em: new Date().toISOString() })
    .eq("asaas_payment_id", payment.id)
    .neq("status", "aprovado");

  console.log(`[webhook/asaas] payment ${payment.id} recusado`);
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
    .eq("comprador_email", pedido.cliente_email.toLowerCase().trim());

  console.log(`[webhook/asaas] pedido ${pedido.id} estornado`);
}

async function handlePaymentOverdue(payment: AsaasPayment) {
  const supabase = createAdminClient();

  await supabase
    .from("pedidos")
    .update({ status: "vencido", atualizado_em: new Date().toISOString() })
    .eq("asaas_payment_id", payment.id)
    .eq("status", "pendente");

  console.log(`[webhook/asaas] payment ${payment.id} vencido`);
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
        comprador_email: pedido.cliente_email.toLowerCase().trim(),
        comprador_nome: pedido.cliente_nome,
        ativo: true,
      },
      { onConflict: "produto_id,comprador_email" }
    );
  }
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
