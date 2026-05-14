"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader, SectionCard } from "@/components/mundo-mapping/affiliate-ui";

type Summary = {
  comissaoPendente: number;
  comissaoAprovada: number;
  comissaoTotal: number;
  totalVendas: number;
};

function MoneyCard({ label, value, sub, highlight = false }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? "border-emerald-200 bg-emerald-50" : "border-zinc-200 bg-white"}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${highlight ? "text-emerald-700" : "text-zinc-950"}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}

export default function InfluencerFinancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/mundo-mapping/influenciador/login"); return; }

      const { data: vendas } = await supabase
        .from("vendas")
        .select("comissao, status")
        .eq("creator_id", user.id);

      if (vendas) {
        const pendente = vendas
          .filter((v) => v.status === "pendente" || v.status === "pending")
          .reduce((s, v) => s + (v.comissao ?? 0), 0);
        const aprovada = vendas
          .filter((v) => v.status === "aprovado" || v.status === "approved" || v.status === "liberado")
          .reduce((s, v) => s + (v.comissao ?? 0), 0);
        setSummary({
          comissaoPendente: pendente,
          comissaoAprovada: aprovada,
          comissaoTotal: vendas.reduce((s, v) => s + (v.comissao ?? 0), 0),
          totalVendas: vendas.length,
        });
      } else {
        setSummary({ comissaoPendente: 0, comissaoAprovada: 0, comissaoTotal: 0, totalVendas: 0 });
      }

      setLoading(false);
    }
    load();
  }, [router]);

  const fmt = (n: number) => `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <>
      <PageHeader
        description="Acompanhe suas comissões e o status dos pagamentos gerados pelos seus links de afiliado."
        eyebrow="Mundo Mapping / Influenciadores / Financeiro"
        title="Financeiro"
      />

      <div className="space-y-6 p-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-100" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MoneyCard label="Total de vendas" value={String(summary?.totalVendas ?? 0)} sub="Rastreadas pelo seu link" />
            <MoneyCard label="Comissão total" value={fmt(summary?.comissaoTotal ?? 0)} sub="Histórico acumulado" />
            <MoneyCard label="Comissão pendente" value={fmt(summary?.comissaoPendente ?? 0)} sub="Dentro da janela de garantia" />
            <MoneyCard highlight label="Comissão disponível" value={fmt(summary?.comissaoAprovada ?? 0)} sub="Aguardando módulo de saque" />
          </div>
        )}

        <SectionCard subtitle="Como funciona o ciclo de pagamento da sua comissão." title="Como funciona">
          <div className="space-y-3">
            {[
              { step: "1", title: "Venda rastreada", desc: "Alguém compra pelo seu link — a venda entra como pendente." },
              { step: "2", title: "Janela de garantia", desc: "A comissão fica retida pelo período de garantia do produto (ex: 14 dias) para proteger contra reembolsos." },
              { step: "3", title: "Comissão aprovada", desc: "Após a janela, a comissão é liberada e fica disponível para saque." },
              { step: "4", title: "Saque", desc: "O módulo de saque está em desenvolvimento. Você será notificado quando estiver disponível." },
            ].map((item) => (
              <div className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-4" key={item.step}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-50 text-sm font-bold text-red-700">
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-950">{item.title}</p>
                  <p className="mt-0.5 text-sm leading-6 text-zinc-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-zinc-700">Módulo de saque em breve</p>
          <p className="mt-2 text-sm text-zinc-500">
            Enquanto isso, acompanhe seus links e cliques em{" "}
            <Link className="font-semibold text-red-700 hover:underline" href="/mundo-mapping/influenciadores/meus-links">
              Meus links
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
