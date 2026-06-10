import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import UpsellSection from "./upsell-section";
import ObrigadoStatus from "./obrigado-status";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function formatCurrency(value: number | undefined): string {
  const num = Number(value ?? 0);
  if (isNaN(num)) return "R$ 0,00";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getFormaPagamentoLabel(forma: string | undefined): string {
  if (!forma) return "—";
  if (forma.toLowerCase().includes("pix")) return "PIX";
  if (forma === "upsell_1click") return "1-Click Upsell";
  if (
    forma.toLowerCase().includes("cart") ||
    forma.toLowerCase().includes("card") ||
    forma.toLowerCase().includes("credit")
  )
    return "Cartão de Crédito";
  return forma;
}

export default async function ObrigadoPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  // Aceita ?pedido_id= (fluxo PIX/upsell) e ?pedido= (callback da tela Asaas).
  const pedidoId = (sp.pedido_id ?? sp.pedido) as string | undefined;

  if (!pedidoId) {
    redirect(`/checkout/${slug}`);
  }

  // Admin client server-side: a leitura de `pedidos` não depende de RLS
  // permissivo para anon e nada além do renderizado chega ao browser.
  // Select restrito aos campos que a tela usa.
  const supabase = createAdminClient();

  // Dados oficiais vêm do banco (o fluxo de cartão volta do Asaas sem query params).
  const { data: pedido } = await supabase
    .from("pedidos")
    .select(
      "status, forma_pagamento, valor, asaas_payment_id, produto_id, cliente_nome, cliente_email, cliente_cpf, cliente_telefone",
    )
    .eq("id", pedidoId)
    .maybeSingle();

  if (!pedido) {
    redirect(`/checkout/${slug}`);
  }

  const { data: produto } = await supabase
    .from("produtos")
    .select("nome, tipo_entregavel")
    .eq("id", pedido.produto_id)
    .maybeSingle();

  const produtoNome = produto?.nome as string | undefined;
  const isDigital = produto?.tipo_entregavel === "digital" || produto?.tipo_entregavel === "curso";
  const pago = pedido.status === "aprovado";

  const nome = pedido.cliente_nome as string | undefined;
  const email = pedido.cliente_email as string | undefined;

  // Upsell params (passados via query pelo fluxo de redirect do client).
  const upsellProdutoId = sp.upsell_produto_id as string | undefined;
  const upsellPreco = parseFloat((sp.upsell_preco as string) ?? "0");
  const upsellHeadline = (sp.upsell_headline as string) ?? "";
  const upsellTimer = parseInt((sp.upsell_timer as string) ?? "10", 10);

  let upsellProduto: {
    id: string;
    slug: string;
    nome: string;
    empresa_id: string;
    preco: number;
    capa_url: string | null;
  } | null = null;

  if (upsellProdutoId) {
    const { data } = await supabase
      .from("produtos")
      .select("id, slug, nome, empresa_id, preco, capa_url")
      .eq("id", upsellProdutoId)
      .eq("status", "published")
      .maybeSingle();
    upsellProduto = data ?? null;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "2rem 1.5rem",
      }}
    >
      {/* Status card */}
      <div
        className="rounded-2xl border border-white/[0.06] bg-white/[0.02]"
        style={{ padding: "2.5rem 2rem", maxWidth: "480px", width: "100%" }}
      >
        <ObrigadoStatus
          asaasPaymentId={pedido.asaas_payment_id ?? null}
          initialPago={pago}
          isDigital={isDigital}
          pedidoId={pedidoId}
        />

        {/* Order summary */}
        <div
          className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02]"
          style={{ padding: "1.25rem", textAlign: "left", fontSize: "0.9rem" }}
        >
          <p className="mb-3 font-semibold text-white">Resumo do pedido</p>

          {produtoNome && (
            <div className="mb-2 flex justify-between">
              <span className="text-[#888]">Produto</span>
              <span className="font-medium text-white">{produtoNome}</span>
            </div>
          )}

          <div className="mb-2 flex justify-between">
            <span className="text-[#888]">Valor</span>
            <span className="font-semibold" style={{ color: "#4ADE80" }}>
              {formatCurrency(pedido.valor as number | undefined)}
            </span>
          </div>

          <div className="mb-2 flex justify-between">
            <span className="text-[#888]">Pagamento</span>
            <span className="font-medium text-white">
              {getFormaPagamentoLabel(pedido.forma_pagamento as string | undefined)}
            </span>
          </div>

          {nome && (
            <div className="mb-2 flex justify-between">
              <span className="text-[#888]">Nome</span>
              <span className="font-medium text-white">{nome}</span>
            </div>
          )}

          {email && (
            <div className="flex justify-between">
              <span className="text-[#888]">E-mail</span>
              <span className="font-medium text-white">{email}</span>
            </div>
          )}
        </div>

        {email && (
          <p className="mt-5 text-center text-sm text-[#888]">
            Um e-mail de confirmação foi enviado para{" "}
            <strong className="text-white">{email}</strong>
          </p>
        )}
      </div>

      {/* Upsell section */}
      {upsellProduto && upsellPreco > 0 && nome && email && (
        <div style={{ maxWidth: "480px", width: "100%" }}>
          <UpsellSection
            cpf={(pedido.cliente_cpf as string) ?? ""}
            email={email}
            nome={nome}
            produto={upsellProduto}
            telefone={(pedido.cliente_telefone as string) ?? ""}
            upsellHeadline={upsellHeadline}
            upsellPreco={upsellPreco}
            upsellTimerMinutos={isNaN(upsellTimer) ? 10 : upsellTimer}
          />
        </div>
      )}
    </div>
  );
}
