import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function formatCurrency(value: string | undefined): string {
  const num = parseFloat(value ?? "0");
  if (isNaN(num)) return "R$ 0,00";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getFormaPagamentoLabel(forma: string | undefined): string {
  if (!forma) return "—";
  if (forma.toLowerCase().includes("pix")) return "PIX";
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
  const resolvedSearchParams = await searchParams;

  const pedidoId = resolvedSearchParams.pedido_id as string | undefined;

  if (!pedidoId) {
    redirect(`/checkout/${slug}`);
  }

  const nome = resolvedSearchParams.nome as string | undefined;
  const email = resolvedSearchParams.email as string | undefined;
  const valor = resolvedSearchParams.valor as string | undefined;
  const formaPagamento = resolvedSearchParams.forma_pagamento as
    | string
    | undefined;
  const produtoNome = resolvedSearchParams.produto_nome as string | undefined;

  const isPix =
    formaPagamento?.toLowerCase().includes("pix") ?? false;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "1rem",
          padding: "2.5rem 2rem",
          maxWidth: "480px",
          width: "100%",
          boxShadow:
            "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}
      >
        {/* Success icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1.5rem",
          }}
        >
          <svg
            width="72"
            height="72"
            viewBox="0 0 72 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="36" cy="36" r="36" fill="#dcfce7" />
            <path
              d="M22 37L31 46L50 27"
              stroke="#16a34a"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#111827",
            marginBottom: "0.5rem",
          }}
        >
          Compra realizada com sucesso!
        </h1>

        {isPix && (
          <p
            style={{
              backgroundColor: "#fef9c3",
              color: "#854d0e",
              borderRadius: "0.5rem",
              padding: "0.75rem 1rem",
              fontSize: "0.875rem",
              marginBottom: "1.25rem",
              fontWeight: 500,
            }}
          >
            Aguardando confirmação do pagamento PIX
          </p>
        )}

        {/* Order summary */}
        <div
          style={{
            backgroundColor: "#f9fafb",
            borderRadius: "0.75rem",
            padding: "1.25rem",
            textAlign: "left",
            marginBottom: "1.5rem",
            fontSize: "0.9rem",
            color: "#374151",
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: "0.75rem", color: "#111827" }}>
            Resumo do pedido
          </p>

          {produtoNome && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ color: "#6b7280" }}>Produto</span>
              <span style={{ fontWeight: 500 }}>{produtoNome}</span>
            </div>
          )}

          {valor && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ color: "#6b7280" }}>Valor pago</span>
              <span style={{ fontWeight: 600, color: "#16a34a" }}>
                {formatCurrency(valor)}
              </span>
            </div>
          )}

          {formaPagamento && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ color: "#6b7280" }}>Pagamento</span>
              <span style={{ fontWeight: 500 }}>
                {getFormaPagamentoLabel(formaPagamento)}
              </span>
            </div>
          )}

          {nome && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ color: "#6b7280" }}>Nome</span>
              <span style={{ fontWeight: 500 }}>{nome}</span>
            </div>
          )}

          {email && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#6b7280" }}>E-mail</span>
              <span style={{ fontWeight: 500 }}>{email}</span>
            </div>
          )}
        </div>

        {/* Confirmation email notice */}
        {email && (
          <p
            style={{
              fontSize: "0.875rem",
              color: "#6b7280",
              marginBottom: "1.5rem",
            }}
          >
            Um e-mail de confirmação foi enviado para{" "}
            <strong style={{ color: "#374151" }}>{email}</strong>
          </p>
        )}

        {/* Back link */}
        <Link
          href="/mundo-mapping/partners"
          style={{
            display: "inline-block",
            fontSize: "0.875rem",
            color: "#6b7280",
            textDecoration: "underline",
          }}
        >
          Voltar para a área de parceiros
        </Link>
      </div>
    </div>
  );
}
