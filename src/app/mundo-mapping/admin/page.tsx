"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminCard, AdminSection, Skeleton, AdminBadge, PlanBadge } from "@/components/mundo-mapping/admin-ui";

type Stats = {
  totalEmpresas: number;
  totalInfluenciadores: number;
  legadoTotal: number;
  legadoAtivados: number;
  totalLinksAtivos: number;
  totalCliques: number;
  totalVendas: number;
  totalComissao: number;
};

type RecentProfile = {
  id: string;
  full_name: string | null;
  razao_social: string | null;
  email: string | null;
  user_type: string;
  plano: string | null;
  created_at: string | null;
};

type RecentVenda = {
  id: string;
  empresa_nome: string | null;
  creator_nome: string | null;
  produto_nome: string | null;
  comissao: number;
  status: string | null;
  criado_em: string;
};

function fmtBRL(n: number) {
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  aprovado: "success",
  pago: "success",
  pendente: "warning",
  revertido: "danger",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentProfiles, setRecentProfiles] = useState<RecentProfile[]>([]);
  const [recentVendas, setRecentVendas] = useState<RecentVenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    const res = await fetch("/api/mundo-mapping/admin/stats");
    if (!res.ok) { setLoadError(true); setLoading(false); return; }
    const json = await res.json();
    setStats({
      totalEmpresas: json.totalEmpresas,
      totalInfluenciadores: json.totalInfluenciadores,
      legadoTotal: json.legadoTotal ?? 0,
      legadoAtivados: json.legadoAtivados ?? 0,
      totalLinksAtivos: json.totalLinksAtivos,
      totalCliques: json.totalCliques,
      totalVendas: json.totalVendas,
      totalComissao: json.totalComissao,
    });
    setRecentProfiles(json.recentProfiles as RecentProfile[]);
    setRecentVendas(json.recentVendas as RecentVenda[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loadError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-7">
        <p className="text-sm text-[#888]">Erro ao carregar dados.</p>
        <button
          className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm font-semibold text-[#aaa] transition hover:bg-[rgba(255,255,255,0.08)]"
          onClick={load}
          type="button"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-7">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-[rgba(255,255,255,0.06)] pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#555]">Admin / Plataforma</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-[#888]">Visão geral em tempo real da plataforma Mapping Partners.</p>
        </div>
        <button
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[rgba(255,255,255,0.06)] px-3 py-1.5 text-xs font-semibold text-[#888] transition hover:border-[rgba(255,255,255,0.12)] hover:text-white disabled:opacity-40"
          disabled={loading}
          onClick={load}
          type="button"
        >
          ↻ Atualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AdminCard
          label="Empresas e produtores"
          loading={loading}
          sub="Usuários com tipo empresa"
          value={stats ? String(stats.totalEmpresas) : "0"}
        />
        <AdminCard
          label="Influenciadores cadastrados"
          loading={loading}
          sub="Usuários com tipo influenciador"
          value={stats ? String(stats.totalInfluenciadores) : "0"}
        />
        <AdminCard
          label="Base legado (Mundo Mapping)"
          loading={loading}
          sub={stats ? `${stats.legadoAtivados.toLocaleString("pt-BR")} já ativaram a conta` : "—"}
          value={stats ? `${stats.legadoTotal.toLocaleString("pt-BR")} creators` : "0"}
        />
        <AdminCard
          label="Links de afiliado ativos"
          loading={loading}
          sub="Em toda a plataforma"
          value={stats ? stats.totalLinksAtivos.toLocaleString("pt-BR") : "0"}
        />
        <AdminCard
          label="Cliques totais"
          loading={loading}
          sub="Rastreados em todos os links"
          value={stats ? stats.totalCliques.toLocaleString("pt-BR") : "0"}
        />
        <AdminCard
          emphasis
          label="Comissão total gerada"
          loading={loading}
          sub="Soma de todas as vendas"
          value={stats ? fmtBRL(stats.totalComissao) : "R$ 0,00"}
        />
        <AdminCard
          label="Vendas rastreadas"
          loading={loading}
          sub="Confirmadas pela plataforma"
          value={stats ? String(stats.totalVendas) : "0"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Recent signups */}
        <AdminSection subtitle="Últimos 10 cadastros na plataforma." title="Cadastros recentes">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton className="h-10" key={i} />)}
            </div>
          ) : recentProfiles.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#555]">Nenhum cadastro ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)] text-left text-xs font-semibold uppercase tracking-[0.1em] text-[#555]">
                    <th className="pb-3">Nome</th>
                    <th className="pb-3">Tipo</th>
                    <th className="pb-3">Plano</th>
                    <th className="pb-3">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
                  {recentProfiles.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5">
                        <p className="font-medium text-[#aaa]">
                          {p.user_type === "empresa" ? (p.razao_social ?? p.full_name ?? "—") : (p.full_name ?? "—")}
                        </p>
                        <p className="text-xs text-[#555]">{p.email ?? "—"}</p>
                      </td>
                      <td className="py-2.5">
                        <AdminBadge
                          label={p.user_type === "empresa" ? "Empresa" : "Creator"}
                          tone={p.user_type === "empresa" ? "info" : "neutral"}
                        />
                      </td>
                      <td className="py-2.5"><PlanBadge plano={p.plano} /></td>
                      <td className="py-2.5 text-xs text-[#888]">{fmtDate(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminSection>

        {/* Recent vendas */}
        <AdminSection subtitle="Últimas 10 vendas registradas na plataforma." title="Vendas recentes">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton className="h-10" key={i} />)}
            </div>
          ) : recentVendas.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#555]">Nenhuma venda registrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)] text-left text-xs font-semibold uppercase tracking-[0.1em] text-[#555]">
                    <th className="pb-3">Produto</th>
                    <th className="pb-3">Creator</th>
                    <th className="pb-3 text-right">Comissão</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
                  {recentVendas.map((v) => (
                    <tr key={v.id}>
                      <td className="py-2.5">
                        <p className="font-medium text-[#aaa]">{v.produto_nome ?? "—"}</p>
                        <p className="text-xs text-[#555]">{v.empresa_nome ?? "—"}</p>
                      </td>
                      <td className="py-2.5 text-[#888]">{v.creator_nome ?? "—"}</td>
                      <td className="py-2.5 text-right font-semibold text-[#aaa]">{fmtBRL(v.comissao ?? 0)}</td>
                      <td className="py-2.5">
                        <AdminBadge
                          label={v.status ?? "pendente"}
                          tone={STATUS_TONE[v.status ?? ""] ?? "neutral"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminSection>
      </div>
    </div>
  );
}
