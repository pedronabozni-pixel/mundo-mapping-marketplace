"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminCard, AdminSection, Skeleton } from "@/components/mundo-mapping/admin-ui";

type Period = "7" | "30" | "90";

type EmpresaRank = { empresa_id: string; empresa_nome: string; vendas: number; comissao: number };
type CreatorRank = { creator_id: string; creator_nome: string; vendas: number; comissao: number };

function fmtBRL(n: number) {
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function exportCSV(empresas: EmpresaRank[], creators: CreatorRank[], period: Period) {
  const rows = [
    ["Tipo", "Nome/ID", "Vendas", "Comissão"],
    ...empresas.map((e) => ["Empresa", e.empresa_nome || e.empresa_id, String(e.vendas), fmtBRL(e.comissao)]),
    ["", "", "", ""],
    ...creators.map((c) => ["Creator", c.creator_nome || c.creator_id, String(c.vendas), fmtBRL(c.comissao)]),
  ];
  const csv = rows.map((r) => r.join(";")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio-${period}d-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminRelatoriosPage() {
  const [period, setPeriod] = useState<Period>("30");
  const [loading, setLoading] = useState(true);
  const [totalVendas, setTotalVendas] = useState(0);
  const [totalComissao, setTotalComissao] = useState(0);
  const [totalCliques, setTotalCliques] = useState(0);
  const [taxaConversao, setTaxaConversao] = useState(0);
  const [empresasRank, setEmpresasRank] = useState<EmpresaRank[]>([]);
  const [creatorsRank, setCreatorsRank] = useState<CreatorRank[]>([]);

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true);
    const supabase = createClient();
    const since = new Date();
    since.setDate(since.getDate() - parseInt(p));
    const sinceISO = since.toISOString();

    const [{ data: vendasData }, { data: linksData }] = await Promise.all([
      supabase.from("vendas").select("empresa_id, empresa_nome, creator_id, creator_nome, comissao").gte("criado_em", sinceISO),
      supabase.from("links_afiliados").select("cliques").eq("ativo", true),
    ]);

    const vendas = (vendasData ?? []) as {
      empresa_id: string; empresa_nome: string | null;
      creator_id: string; creator_nome: string | null;
      comissao: number;
    }[];

    const links = (linksData ?? []) as { cliques: number }[];

    const cliquesTotal = links.reduce((s, l) => s + (l.cliques ?? 0), 0);
    const comissaoTotal = vendas.reduce((s, v) => s + (v.comissao ?? 0), 0);
    const conversao = cliquesTotal > 0 ? (vendas.length / cliquesTotal) * 100 : 0;

    setTotalVendas(vendas.length);
    setTotalComissao(comissaoTotal);
    setTotalCliques(cliquesTotal);
    setTaxaConversao(conversao);

    // Ranking empresas
    const empMap: Record<string, EmpresaRank> = {};
    vendas.forEach((v) => {
      if (!empMap[v.empresa_id]) empMap[v.empresa_id] = { empresa_id: v.empresa_id, empresa_nome: v.empresa_nome ?? v.empresa_id, vendas: 0, comissao: 0 };
      empMap[v.empresa_id].vendas++;
      empMap[v.empresa_id].comissao += v.comissao ?? 0;
    });
    setEmpresasRank(Object.values(empMap).sort((a, b) => b.comissao - a.comissao).slice(0, 10));

    // Ranking creators
    const creMap: Record<string, CreatorRank> = {};
    vendas.forEach((v) => {
      if (!creMap[v.creator_id]) creMap[v.creator_id] = { creator_id: v.creator_id, creator_nome: v.creator_nome ?? v.creator_id, vendas: 0, comissao: 0 };
      creMap[v.creator_id].vendas++;
      creMap[v.creator_id].comissao += v.comissao ?? 0;
    });
    setCreatorsRank(Object.values(creMap).sort((a, b) => b.comissao - a.comissao).slice(0, 10));

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(period); }, [period, fetchData]);

  const periodOptions: { label: string; value: Period }[] = [
    { label: "7 dias", value: "7" },
    { label: "30 dias", value: "30" },
    { label: "90 dias", value: "90" },
  ];

  return (
    <div className="space-y-6 p-7">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">Admin / Relatórios</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Relatórios da plataforma</h1>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Period toggle */}
          <div className="flex rounded-xl border border-zinc-800 p-1">
            {periodOptions.map((opt) => (
              <button
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  period === opt.value ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
            onClick={() => exportCSV(empresasRank, creatorsRank, period)}
            type="button"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminCard emphasis label="Comissão total" loading={loading} sub={`Últimos ${period} dias`} value={fmtBRL(totalComissao)} />
        <AdminCard label="Vendas geradas" loading={loading} sub={`Últimos ${period} dias`} value={totalVendas.toLocaleString("pt-BR")} />
        <AdminCard label="Cliques totais" loading={loading} sub="Links ativos na plataforma" value={totalCliques.toLocaleString("pt-BR")} />
        <AdminCard label="Taxa de conversão" loading={loading} sub="Cliques → vendas" value={`${taxaConversao.toFixed(2)}%`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Empresas ranking */}
        <AdminSection subtitle={`Top empresas por comissão gerada — últimos ${period} dias`} title="Ranking de empresas">
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton className="h-10" key={i} />)}</div>
          ) : empresasRank.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-600">Nenhuma venda no período.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs font-semibold uppercase tracking-[0.1em] text-zinc-600">
                  <th className="pb-3">#</th>
                  <th className="pb-3">Empresa</th>
                  <th className="pb-3 text-right">Vendas</th>
                  <th className="pb-3 text-right">Comissão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {empresasRank.map((e, idx) => (
                  <tr key={e.empresa_id}>
                    <td className="py-2.5 text-xs font-bold text-zinc-600">{idx + 1}</td>
                    <td className="py-2.5 font-medium text-zinc-300">{e.empresa_nome}</td>
                    <td className="py-2.5 text-right text-zinc-400">{e.vendas}</td>
                    <td className="py-2.5 text-right font-semibold text-zinc-300">{fmtBRL(e.comissao)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminSection>

        {/* Creators ranking */}
        <AdminSection subtitle={`Top creators por comissão gerada — últimos ${period} dias`} title="Ranking de creators">
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton className="h-10" key={i} />)}</div>
          ) : creatorsRank.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-600">Nenhuma venda no período.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs font-semibold uppercase tracking-[0.1em] text-zinc-600">
                  <th className="pb-3">#</th>
                  <th className="pb-3">Creator</th>
                  <th className="pb-3 text-right">Vendas</th>
                  <th className="pb-3 text-right">Comissão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {creatorsRank.map((c, idx) => (
                  <tr key={c.creator_id}>
                    <td className="py-2.5 text-xs font-bold text-zinc-600">{idx + 1}</td>
                    <td className="py-2.5 font-medium text-zinc-300">{c.creator_nome}</td>
                    <td className="py-2.5 text-right text-zinc-400">{c.vendas}</td>
                    <td className="py-2.5 text-right font-semibold text-zinc-300">{fmtBRL(c.comissao)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminSection>
      </div>
    </div>
  );
}
