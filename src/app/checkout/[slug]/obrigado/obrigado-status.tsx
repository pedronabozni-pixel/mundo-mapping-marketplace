"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/**
 * Status do pedido na tela de obrigado.
 *
 * - PIX: chega aqui já aprovado (a confirmação acontece no checkout antes do
 *   redirect), então mostra "confirmado" direto.
 * - Cartão (tela hospedada Asaas): o comprador volta com o pedido ainda
 *   "pendente"; o acesso é liberado pelo webhook. Aqui fazemos polling do
 *   mesmo endpoint do PIX (pix-status) para refletir a confirmação em tempo real.
 */
export default function ObrigadoStatus({
  pedidoId,
  asaasPaymentId,
  initialPago,
  isDigital,
}: {
  pedidoId: string;
  asaasPaymentId: string | null;
  initialPago: boolean;
  isDigital: boolean;
}) {
  const [pago, setPago] = useState(initialPago);

  useEffect(() => {
    if (pago || !asaasPaymentId) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/checkout/pix-status?payment_id=${encodeURIComponent(asaasPaymentId)}&pedido_id=${encodeURIComponent(pedidoId)}`,
        );
        const data = await res.json();
        if (data.pago) {
          setPago(true);
          clearInterval(timer);
        }
      } catch {
        /* erro de rede — tenta de novo no próximo tick */
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [pago, asaasPaymentId, pedidoId]);

  if (!pago) {
    return (
      <div className="text-center">
        <div className="mb-5 flex items-center justify-center">
          <span className="h-16 w-16 animate-spin rounded-full border-4 border-white/10 border-t-[#FBBF24]" />
        </div>
        <h1 className="mb-2 text-2xl font-extrabold text-white">Processando pagamento...</h1>
        <p
          className="mx-auto mb-2 inline-block rounded-lg px-4 py-2.5 text-sm font-medium"
          style={{ backgroundColor: "rgba(251,191,36,0.1)", color: "#FBBF24" }}
        >
          Assim que o pagamento for confirmado, seu acesso é liberado automaticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mb-5 flex items-center justify-center">
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="36" cy="36" r="36" fill="rgba(74,222,128,0.12)" />
          <path d="M22 37L31 46L50 27" stroke="#4ADE80" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h1 className="mb-2 text-2xl font-extrabold text-white">Pagamento confirmado!</h1>
      <p className="mb-6 text-sm text-[#888]">Seu pedido foi concluído com sucesso.</p>

      {isDigital ? (
        <Link
          href="/membros"
          className="inline-block w-full rounded-xl py-4 text-sm font-bold text-white transition hover:opacity-90"
          style={{ backgroundColor: "#C8102E" }}
        >
          Acessar área de membros →
        </Link>
      ) : (
        <Link
          href="/mundo-mapping/partners"
          className="inline-block text-sm text-[#888] underline transition hover:text-white"
        >
          Voltar para a área de parceiros
        </Link>
      )}
    </div>
  );
}
