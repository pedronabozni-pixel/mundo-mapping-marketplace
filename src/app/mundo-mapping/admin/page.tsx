"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminCard, AdminSection, Skeleton, AdminBadge, PlanBadge } from "@/components/mundo-mapping/admin-ui";

type Stats = {
  totalEmpresas: number;
  totalInfluenciadores: number;
  totalLinksAtivos: number;
  totalCliques: number;
  totalVendas: number;
  totalComissao: number;
};

type RecentProfile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
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

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [
        { count: empCount },
        { count: infCount },
        { data: linksData },
        { data: vendasData },
        { data: recentP },
        { data: recentV },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("user_type", "empresa"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("user_type", "influenciador"),
        supabase.from("links_afiliados").select("cliques").eq("ativo", true),
        supabase.from("vendas").select("comissao"),
        supabase.from("profiles")
          .select("id, full_name, company_name, email, user_type, plano, created_at")
          .neq("user_type", "admin")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase.from("vendas")
          .select("id, empresa_nome, creator_nome, produto_nome, comissao, status, criado_em")
          .order("criado_em", { ascending: false })
          .limit(10),
      ]);

      const links = linksData ?? [];
      const vendas = vendasData ?? [];

      setStats({
        totalEmpresas: empCount ?? 0,
        totalInfluenciadores: infCount ?? 0,
        totalLinksAtivos: links.length,
        totalCliques: links.reduce((s, l) => s + (l.cliques ?? 0), 0),
        totalVendas: vendas.length,
        totalComissao: vendas.reduce((s, v) => s + (v.comissao ?? 0), 0),
      });
      setRecentProfiles((recentP ?? []) as RecentProfile[]);
      setRecentVendas((recentV ?? []) as RecentVenda[]);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6 p-7">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">Admin / Plataforma</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">Visão geral em tempo real da plataforma Mapping Partners.</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AdminCard
          label="Empresas cadastradas"
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
            <p className="py-6 text-center text-sm text-zinc-600">Nenhum cadastro ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-xs font-semibold uppercase tracking-[0.1em] text-zinc-600">
                    <th className="pb-3">Nome</th>
                    <th className="pb-3">Tipo</th>
                    <th className="pb-3">Plano</th>
                    <th className="pb-3">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {recentProfiles.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5">
                        <p className="font-medium text-zinc-300">
                          {p.user_type === "empresa" ? (p.company_name ?? p.full_name ?? "—") : (p.full_name ?? "—")}
                        </p>
                        <p className="text-xs text-zinc-600">{p.email ?? "—"}</p>
                      </td>
                      <td className="py-2.5">
                        <AdminBadge
                          label={p.user_type === "empresa" ? "Empresa" : "Creator"}
                          tone={p.user_type === "empresa" ? "info" : "neutral"}
                        />
                      </td>
                      <td className="py-2.5"><PlanBadge plano={p.plano} /></td>
                      <td className="py-2.5 text-xs text-zinc-500">{fmtDate(p.created_at)}</td>
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
            <p className="py-6 text-center text-sm text-zinc-600">Nenhuma venda registrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-xs font-semibold uppercase tracking-[0.1em] text-zinc-600">
                    <th className="pb-3">Produto</th>
                    <th className="pb-3">Creator</th>
                    <th className="pb-3 text-right">Comissão</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {recentVendas.map((v) => (
                    <tr key={v.id}>
                      <td className="py-2.5">
                        <p className="font-medium text-zinc-300">{v.produto_nome ?? "—"}</p>
                        <p className="text-xs text-zinc-600">{v.empresa_nome ?? "—"}</p>
                      </td>
                      <td className="py-2.5 text-zinc-400">{v.creator_nome ?? "—"}</td>
                      <td className="py-2.5 text-right font-semibold text-zinc-300">{fmtBRL(v.comissao ?? 0)}</td>
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
