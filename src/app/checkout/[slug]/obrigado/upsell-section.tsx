"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type UpsellProduto = {
  id: string;
  slug: string;
  nome: string;
  empresa_id: string;
  preco: number;
  capa_url: string | null;
};

function fmtMoney(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

export default function UpsellSection({
  produto,
  upsellPreco,
  upsellHeadline,
  upsellTimerMinutos,
  nome,
  email,
  cpf,
  telefone,
}: {
  produto: UpsellProduto;
  upsellPreco: number;
  upsellHeadline: string;
  upsellTimerMinutos: number;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
}) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(upsellTimerMinutos * 60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");
  const expired = secondsLeft === 0;

  async function handleAccept() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produto_id: produto.id,
          produto_nome: produto.nome,
          empresa_id: produto.empresa_id,
          valor: upsellPreco,
          forma_pagamento: "upsell_1click",
          parcelas: 1,
          cliente: { nome, email, cpf, telefone },
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Erro ao processar.");
        setLoading(false);
        return;
      }
      const params = new URLSearchParams({
        pedido_id: data.pedido_id,
        nome,
        email,
        valor: String(upsellPreco),
        forma_pagamento: "upsell_1click",
        produto_nome: produto.nome,
      });
      router.push(`/checkout/${produto.slug}/obrigado?${params}`);
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  if (declined || expired) return null;

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border-2 border-amber-400 bg-white shadow-xl">
      {/* Timer bar */}
      <div className="bg-amber-400 px-6 py-3 text-center">
        <p className="text-sm font-bold text-amber-900">
          ⚡ Oferta exclusiva expira em{" "}
          <span className="font-mono text-lg">{mins}:{secs}</span>
        </p>
      </div>

      <div className="p-6 md:p-8">
        {upsellHeadline && (
          <h2 className="mb-6 text-center text-xl font-bold leading-snug text-zinc-900 md:text-2xl">
            {upsellHeadline}
          </h2>
        )}

        {/* Product card */}
        <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row">
          {produto.capa_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={produto.nome}
              className="h-32 w-32 shrink-0 rounded-xl object-cover shadow-md"
              src={produto.capa_url}
            />
          )}
          <div className="text-center sm:text-left">
            <p className="text-lg font-bold text-zinc-900">{produto.nome}</p>
            <div className="mt-2 flex items-baseline justify-center gap-3 sm:justify-start">
              <span className="text-base text-zinc-400 line-through">
                R$ {fmtMoney(produto.preco)}
              </span>
              <span className="text-2xl font-bold text-emerald-600">
                R$ {fmtMoney(upsellPreco)}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          className="mb-3 w-full rounded-xl bg-emerald-600 py-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          disabled={loading}
          onClick={handleAccept}
          type="button"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Processando...
            </span>
          ) : (
            `✅ Sim! Quero por R$ ${fmtMoney(upsellPreco)}`
          )}
        </button>

        <button
          className="w-full text-center text-xs text-zinc-400 underline transition hover:text-zinc-600"
          onClick={() => setDeclined(true)}
          type="button"
        >
          Não, obrigado. Não quero esta oferta.
        </button>
      </div>
    </div>
  );
}
