"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MetricCard, SectionCard, StatusBadge } from "@/components/mundo-mapping/affiliate-ui";

type Venda = {
  id: string;
  criado_em: string;
  produto_nome: string;
  creator_nome: string;
  comissao: number;
  status: string;
};

type DashData = {
  totalVendas: number;
  comissaoTotal: number;
  comissaoPendente: number;
  comissaoPaga: number;
  vendas: Venda[];
};

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  aprovado: "success",
  pago: "success",
  pendente: "warning",
  revertido: "danger",
};

function formatBRL(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function FinanceiroPage() {
  const router = useRouter();
  const [dash, setDash] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/mundo-mapping/empresa/login");
        return;
      }

      const { data: vendasData } = await supabase
        .from("vendas")
        .select("id, criado_em, produto_nome, creator_nome, comissao, status")
        .eq("empresa_id", user.id)
        .order("criado_em", { ascending: false });

      if (cancelled) return;

      const vendas = (vendasData ?? []) as Venda[];
      const comissaoTotal = vendas.reduce((s, v) => s + (v.comissao ?? 0), 0);
      const comissaoPendente = vendas
        .filter((v) => v.status === "pendente")
        .reduce((s, v) => s + (v.comissao ?? 0), 0);
      const comissaoPaga = vendas
        .filter((v) => v.status === "pago" || v.status === "aprovado")
        .reduce((s, v) => s + (v.comissao ?? 0), 0);

      setDash({ totalVendas: vendas.length, comissaoTotal, comissaoPendente, comissaoPaga, vendas });
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  const isEmpty = !dash || dash.totalVendas === 0;

  return (
    <div className="space-y-6 p-6">
      {/* KPIs */}
      <div className="grid gap-4 xl:grid-cols-4">
        <MetricCard
          emphasis
          label="Comissão total"
          meta="Todas as vendas"
          value={isEmpty ? "R$ 0,00" : formatBRL(dash!.comissaoTotal)}
        />
        <MetricCard
          label="Pendente"
          meta="Em janela de garantia"
          value={isEmpty ? "R$ 0,00" : formatBRL(dash!.comissaoPendente)}
        />
        <MetricCard
          label="Liquidado"
          meta="Aprovado ou pago"
          value={isEmpty ? "R$ 0,00" : formatBRL(dash!.comissaoPaga)}
        />
        <MetricCard
          label="Total de vendas"
          meta="Rastreadas pela plataforma"
          value={isEmpty ? "0" : String(dash!.totalVendas)}
        />
      </div>

      {/* Extrato */}
      <SectionCard
        subtitle="Histórico de comissões por venda rastreada via links de afiliado."
        title="Extrato financeiro"
      >
        {isEmpty ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center">
            <p className="text-sm font-medium text-zinc-700">Nenhuma movimentação financeira ainda.</p>
            <p className="mt-2 text-sm text-zinc-500">
              As vendas geradas pelos creators aparecem aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-[0.1em] text-zinc-400">
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Creator</th>
                  <th className="px-4 py-3 text-right">Comissão</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {dash!.vendas.map((v) => (
                  <tr className="transition hover:bg-zinc-50" key={v.id}>
                    <td className="px-4 py-3 text-zinc-500">{formatDate(v.criado_em)}</td>
                    <td className="px-4 py-3 font-medium text-zinc-800">{v.produto_nome || "—"}</td>
                    <td className="px-4 py-3 text-zinc-500">{v.creator_nome || "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-zinc-800">
                      {formatBRL(v.comissao ?? 0)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={v.status ?? "pendente"}
                        tone={STATUS_TONE[v.status] ?? "neutral"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* How commissions work */}
      <SectionCard subtitle="Regras do ciclo financeiro." title="Estados financeiros">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: "Pendente", desc: "Venda aprovada, mas ainda em janela de garantia do produto." },
            { label: "Aprovado", desc: "Comissão elegível para liquidação após encerramento da janela." },
            { label: "Pago", desc: "Repasse finalizado para o creator." },
            { label: "Revertido", desc: "Estorno, cancelamento ou chargeback registrado." },
          ].map((item) => (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4" key={item.label}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">{item.label}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-700">{item.desc}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
