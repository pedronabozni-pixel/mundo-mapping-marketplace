"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MetricCard, SectionCard } from "@/components/mundo-mapping/affiliate-ui";

type Stats = {
  totalLinks: number;
  creatoresUnicos: number;
  totalCliques: number;
  totalVendas: number;
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: linksData }, { data: vendasData }] = await Promise.all([
        supabase.from("links_afiliados").select("creator_id, cliques").eq("empresa_id", user.id),
        supabase.from("vendas").select("id").eq("empresa_id", user.id),
      ]);

      const links = (linksData ?? []) as { creator_id: string; cliques: number }[];
      setStats({
        totalLinks: links.length,
        creatoresUnicos: new Set(links.map((l) => l.creator_id)).size,
        totalCliques: links.reduce((s, l) => s + (l.cliques ?? 0), 0),
        totalVendas: (vendasData ?? []).length,
      });
    }
    load();
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* KPIs — dados reais */}
      <div className="grid gap-4 xl:grid-cols-4">
        <MetricCard
          emphasis
          label="Links gerados"
          meta="Pelos creators para seus produtos"
          value={stats ? String(stats.totalLinks) : "…"}
        />
        <MetricCard
          label="Creators únicos"
          meta="Com ao menos um link ativo"
          value={stats ? String(stats.creatoresUnicos) : "…"}
        />
        <MetricCard
          label="Total de cliques"
          meta="Rastreados em todos os links"
          value={stats ? stats.totalCliques.toLocaleString("pt-BR") : "…"}
        />
        <MetricCard
          label="Vendas rastreadas"
          meta="Confirmadas pela plataforma"
          value={stats ? String(stats.totalVendas) : "…"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Governance links */}
        <SectionCard subtitle="Ações de gestão da sua operação." title="Gestão">
          <div className="space-y-3">
            <Link
              className="block w-full rounded-2xl border border-zinc-200 px-4 py-4 text-left text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              href="/mundo-mapping/afiliados/creators"
            >
              Gerenciar creators afiliados
            </Link>
            <Link
              className="block w-full rounded-2xl border border-zinc-200 px-4 py-4 text-left text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              href="/mundo-mapping/afiliados/financeiro"
            >
              Ver extrato financeiro
            </Link>
            <Link
              className="block w-full rounded-2xl border border-zinc-200 px-4 py-4 text-left text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              href="/mundo-mapping/afiliados/relatorio"
            >
              Relatório de campanhas
            </Link>
            <Link
              className="block w-full rounded-2xl bg-zinc-900 px-4 py-4 text-left text-sm font-semibold text-white transition hover:bg-zinc-800"
              href="/mundo-mapping/afiliados"
            >
              Ir para o dashboard de produtos
            </Link>
          </div>
        </SectionCard>

        {/* How commissions work */}
        <SectionCard subtitle="Regras do ecossistema de afiliados." title="Como funciona">
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Links de afiliado</p>
              <p className="mt-2 text-sm leading-6 text-zinc-700">
                Cada creator gera um link único por produto. Todos os cliques e vendas são rastreados por esse código.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Comissão</p>
              <p className="mt-2 text-sm leading-6 text-zinc-700">
                Entra como pendente, respeita a janela de garantia do produto e depois fica disponível para repasse ao creator.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Controle</p>
              <p className="mt-2 text-sm leading-6 text-zinc-700">
                Você pode ativar ou desativar qualquer link de creator na página de Creators afiliados.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
