"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader, SectionCard } from "@/components/mundo-mapping/affiliate-ui";

const SAQUE_MINIMO = 100;

type Summary = {
  comissaoDisponivel: number;
  comissaoTotal: number;
  totalVendas: number;
};

type TipoChave = "cpf" | "cnpj" | "email" | "telefone" | "aleatoria";

const TIPO_LABEL: Record<TipoChave, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  email: "E-mail",
  telefone: "Telefone",
  aleatoria: "Chave aleatória",
};

function MoneyCard({
  label, value, sub, highlight = false,
}: {
  label: string; value: string; sub?: string; highlight?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={
        highlight
          ? { background: "linear-gradient(135deg, rgba(74,222,128,0.06) 0%, transparent 100%)", border: "1px solid rgba(74,222,128,0.15)" }
          : { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }
      }
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: highlight ? "#4ADE80" : "#888" }}>
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold" style={{ color: highlight ? "#4ADE80" : "#fff" }}>{value}</p>
      {sub && <p className="mt-1 text-xs" style={{ color: "#555" }}>{sub}</p>}
    </div>
  );
}

function SaqueModal({
  disponivel,
  onClose,
  onSuccess,
  userId,
}: {
  disponivel: number;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}) {
  const [chave, setChave] = useState("");
  const [tipo, setTipo] = useState<TipoChave>("cpf");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fmt = (n: number) => `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!chave.trim()) { setError("Informe a chave PIX."); return; }
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.from("solicitacoes_saque").insert({
        creator_id: userId,
        valor: disponivel,
        chave_pix: chave.trim(),
        tipo_chave_pix: tipo,
      });
      if (err) { setError(err.message); return; }
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao solicitar saque.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-0 sm:items-center sm:pb-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ background: "rgba(0,0,0,0.7)" }}
    >
      <div
        className="w-full max-w-md rounded-t-3xl p-6 sm:rounded-3xl"
        style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Solicitar saque</h2>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full transition"
            onClick={onClose}
            style={{ color: "#555" }}
            type="button"
          >
            ✕
          </button>
        </div>

        <div
          className="mb-5 rounded-2xl px-4 py-4"
          style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "#4ADE80" }}>Valor disponível</p>
          <p className="mt-1 text-2xl font-semibold" style={{ color: "#4ADE80" }}>{fmt(disponivel)}</p>
        </div>

        {error && (
          <div
            className="mb-4 rounded-xl px-4 py-3 text-sm"
            style={{ background: "rgba(200,16,46,0.08)", border: "1px solid rgba(200,16,46,0.2)", color: "#C8102E" }}
          >
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: "#888" }}>Tipo de chave PIX</label>
            <select
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none transition"
              onChange={(e) => setTipo(e.target.value as TipoChave)}
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }}
              value={tipo}
            >
              {(Object.entries(TIPO_LABEL) as [TipoChave, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: "#888" }}>Chave PIX</label>
            <input
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-[#555]"
              onChange={(e) => setChave(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = "#C8102E")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              placeholder={
                tipo === "cpf" ? "000.000.000-00"
                  : tipo === "cnpj" ? "00.000.000/0000-00"
                  : tipo === "email" ? "seu@email.com"
                  : tipo === "telefone" ? "+55 11 99999-9999"
                  : "Chave aleatória (UUID)"
              }
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
              type="text"
              value={chave}
            />
          </div>

          <button
            className="w-full rounded-xl bg-[#C8102E] py-3 text-sm font-bold text-white shadow-[0_18px_40px_-25px_rgba(200,16,46,0.8)] transition hover:bg-[#A30D24] disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? "Solicitando…" : "Confirmar solicitação"}
          </button>

          <p className="text-center text-xs" style={{ color: "#555" }}>
            Saques são processados em até 5 dias úteis
          </p>
        </form>
      </div>
    </div>
  );
}

export default function InfluencerFinancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [userId, setUserId] = useState("");
  const [saqueModalOpen, setSaqueModalOpen] = useState(false);
  const [saqueSuccess, setSaqueSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/mundo-mapping/influenciador/login"); return; }
      setUserId(user.id);

      const { data: vendas } = await supabase
        .from("vendas")
        .select("comissao_creator")
        .eq("creator_id", user.id);

      if (vendas) {
        const disponivel = vendas.reduce((s, v) => s + ((v.comissao_creator as number) ?? 0), 0);
        setSummary({
          comissaoDisponivel: disponivel,
          comissaoTotal: disponivel,
          totalVendas: vendas.length,
        });
      } else {
        setSummary({ comissaoDisponivel: 0, comissaoTotal: 0, totalVendas: 0 });
      }

      setLoading(false);
    }
    load();
  }, [router]);

  const fmt = (n: number) => `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const disponivel = summary?.comissaoDisponivel ?? 0;
  const podeReqSaque = disponivel >= SAQUE_MINIMO;

  function handleSaqueSuccess() {
    setSaqueModalOpen(false);
    setSaqueSuccess(true);
  }

  return (
    <>
      <PageHeader
        description="Acompanhe suas comissões e solicite saques via PIX."
        eyebrow="Mundo Mapping / Influenciadores / Financeiro"
        title="Financeiro"
      />

      <div className="space-y-6 p-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <MoneyCard label="Total de vendas" value={String(summary?.totalVendas ?? 0)} sub="Rastreadas pelo seu link" />
            <MoneyCard label="Comissão total" value={fmt(summary?.comissaoTotal ?? 0)} sub="Histórico acumulado" />
            <MoneyCard highlight label="Disponível para saque" value={fmt(disponivel)} sub="Comissões confirmadas" />
          </div>
        )}

        <SectionCard subtitle="Como funciona o ciclo de pagamento da sua comissão." title="Como funciona">
          <div className="space-y-3">
            {[
              { step: "1", title: "Venda rastreada", desc: "Alguém compra pelo seu link — a venda entra como pendente." },
              { step: "2", title: "Janela de garantia", desc: "A comissão fica retida pelo período de garantia do produto (ex: 14 dias) para proteger contra reembolsos." },
              { step: "3", title: "Comissão aprovada", desc: "Após a janela, a comissão é liberada e fica disponível para saque." },
              { step: "4", title: "Saque via PIX", desc: "Solicite o saque informando sua chave PIX. O valor é transferido em até 5 dias úteis." },
            ].map((item) => (
              <div
                className="flex gap-4 rounded-2xl p-4"
                key={item.step}
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                  style={{ background: "rgba(200,16,46,0.1)", color: "#C8102E" }}
                >
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-0.5 text-sm leading-6" style={{ color: "#888" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Saque section */}
        {!loading && (
          <div
            className="rounded-2xl p-6"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {saqueSuccess ? (
              <div className="text-center">
                <div
                  className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ background: "rgba(74,222,128,0.12)" }}
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ color: "#4ADE80" }} viewBox="0 0 24 24">
                    <path d="M4.5 12.75l6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-white">Solicitação enviada!</p>
                <p className="mt-1 text-sm" style={{ color: "#888" }}>Seu saque será processado em até 5 dias úteis.</p>
              </div>
            ) : podeReqSaque ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <div>
                  <p className="text-sm font-semibold text-white">Você tem {fmt(disponivel)} disponível</p>
                  <p className="mt-1 text-sm" style={{ color: "#888" }}>Solicite o saque para receber via PIX.</p>
                </div>
                <button
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-[#C8102E] px-8 text-sm font-bold text-white shadow-[0_8px_24px_-10px_rgba(200,16,46,0.7)] transition hover:bg-[#A30D24]"
                  onClick={() => setSaqueModalOpen(true)}
                  type="button"
                >
                  Solicitar saque
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm font-semibold text-white">Saldo insuficiente para saque</p>
                <p className="mt-2 text-sm" style={{ color: "#888" }}>
                  Saldo mínimo para saque é{" "}
                  <span className="font-semibold text-white">{fmt(SAQUE_MINIMO)}</span>
                  {". "}
                  Você tem{" "}
                  <span className="font-semibold text-white">{fmt(disponivel)}</span> disponível.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {saqueModalOpen && (
        <SaqueModal
          disponivel={disponivel}
          onClose={() => setSaqueModalOpen(false)}
          onSuccess={handleSaqueSuccess}
          userId={userId}
        />
      )}
    </>
  );
}
