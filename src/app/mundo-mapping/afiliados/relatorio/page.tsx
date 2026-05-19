"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader, SectionCard, StatusBadge } from "@/components/mundo-mapping/affiliate-ui";
import { UpgradeModal } from "@/components/mundo-mapping/empresa-plan-banner";

type Plan = "associate" | "partner" | "elite";
type Period = "7" | "30" | "90";

interface Metrics {
  totalClicks: number;
  totalVendas: number;
  totalComissao: number;
  activeCreators: number;
}

interface TimelinePoint { date: string; clicks: number; vendas: number; }
interface CreatorRow { creator_id: string; name: string; produto: string; clicks: number; vendas: number; comissao: number; ativo: boolean; }
interface ProductRow { produto_id: string; nome: string; creators: number; clicks: number; vendas: number; gmv: number; comissao: number; }

function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-100 ${className}`} />;
}

function DualLineChart({ data }: { data: TimelinePoint[] }) {
  if (!data.length) return (
    <div className="flex h-52 items-center justify-center rounded-[20px] border border-zinc-200 bg-zinc-50">
      <p className="text-sm text-zinc-400">Nenhum dado para o período</p>
    </div>
  );

  const W = 960; const H = 220; const PAD = 16;
  const maxC = Math.max(...data.map(d => d.clicks), 1);
  const maxV = Math.max(...data.map(d => d.vendas), 1);
  const maxY = Math.max(maxC, maxV, 1);
  const step = (W - PAD * 2) / Math.max(data.length - 1, 1);

  function pts(key: "clicks" | "vendas") {
    return data.map((d, i) => {
      const x = PAD + i * step;
      const y = H - PAD - ((d[key]) / maxY) * (H - PAD * 2);
      return `${x},${y}`;
    }).join(" ");
  }

  function poly(key: "clicks" | "vendas") {
    const p = pts(key);
    const lastX = PAD + (data.length - 1) * step;
    return `${PAD},${H - PAD} ${p} ${lastX},${H - PAD}`;
  }

  return (
    <div className="rounded-[20px] border border-zinc-200 bg-zinc-50/70 p-4">
      <svg className="h-52 w-full" preserveAspectRatio="none" viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="fillC" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#71717a" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#71717a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="fillV" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#dc2626" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon fill="url(#fillC)" points={poly("clicks")} />
        <polygon fill="url(#fillV)" points={poly("vendas")} />
        <polyline fill="none" points={pts("clicks")} stroke="#71717a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        <polyline fill="none" points={pts("vendas")} stroke="#dc2626" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      </svg>
      <div className="mt-3 flex flex-wrap justify-between gap-2">
        <div className="flex gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-zinc-400" />Cliques</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />Vendas</span>
        </div>
        <div className="flex gap-3 text-xs text-zinc-400">
          {data.filter((_, i) => i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1)
            .map(d => <span key={d.date}>{d.date}</span>)}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, icon, loading }: { label: string; value: string; sub: string; icon: string; loading: boolean }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_18px_60px_-45px_rgba(24,24,27,0.28)]">
      {loading ? (
        <>
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-zinc-500">{label}</p>
            <span className="text-lg">{icon}</span>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">{value}</p>
          <p className="mt-1 text-xs text-zinc-400">{sub}</p>
        </>
      )}
    </div>
  );
}

function UpgradeWall({ plan, onUpgrade }: { plan: Plan; onUpgrade: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
        <svg className="h-8 w-8 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold tracking-tight text-zinc-950">Recurso exclusivo Partner e Elite</h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-zinc-500">
        O relatório de desempenho de campanhas está disponível nos planos <strong>Partner</strong> e <strong>Elite</strong>.
        Você está no plano <strong>Associate</strong>. Faça upgrade para acessar métricas em tempo real, gráficos e análise por creator.
      </p>
      <button
        className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-6 text-sm font-bold text-white shadow-[0_8px_24px_-10px_rgba(220,38,38,0.7)] transition hover:bg-red-700"
        onClick={onUpgrade}
        type="button"
      >
        Fazer upgrade
      </button>
    </div>
  );
}

export default function RelatorioPage() {
  const [pageLoading, setPageLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [plan, setPlan] = useState<Plan>("associate");
  const [userId, setUserId] = useState("");
  const [period, setPeriod] = useState<Period>("30");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [metrics, setMetrics] = useState<Metrics>({ totalClicks: 0, totalVendas: 0, totalComissao: 0, activeCreators: 0 });
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [creators, setCreators] = useState<CreatorRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);

  const since = useCallback(() => {
    const d = new Date();
    d.setDate(d.getDate() - parseInt(period));
    return d.toISOString();
  }, [period]);

  const fetchData = useCallback(async (uid: string) => {
    setDataLoading(true);
    const supabase = createClient();
    const from = since();

    // clicks come from links_afiliados.cliques (aggregate totals, no per-event table)
    const [{ data: links }, { data: vendas }] = await Promise.all([
      supabase.from("links_afiliados").select("id, creator_id, produto_id, produto_nome, cliques").eq("empresa_id", uid).eq("ativo", true),
      supabase.from("vendas").select("*").eq("empresa_id", uid).gte("criado_em", from),
    ]);

    const l = links ?? [];
    const v = vendas ?? [];

    const totalClicks = l.reduce((s, r) => s + ((r.cliques as number) ?? 0), 0);
    const totalVendas = v.length;
    const totalComissao = v.reduce((s: number, r: Record<string, number>) => s + (r.comissao_creator ?? 0), 0);
    const creatorIds = new Set([
      ...l.map((r) => r.creator_id as string),
      ...v.map((r: Record<string, string>) => r.creator_id),
    ].filter(Boolean));
    const activeCreators = creatorIds.size;

    setMetrics({ totalClicks, totalVendas, totalComissao, activeCreators });

    // Timeline grouped by day — vendas have timestamps; clicks are aggregate totals only
    const days = parseInt(period);
    const pointMap: Record<string, TimelinePoint> = {};
    for (let i = days; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      pointMap[key] = { date: key, clicks: 0, vendas: 0 };
    }
    v.forEach((r: Record<string, string>) => {
      const key = new Date(r.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      if (pointMap[key]) pointMap[key].vendas++;
    });
    setTimeline(Object.values(pointMap));

    // Creators table — clicks from links_afiliados, sales from vendas
    const creatorMap: Record<string, CreatorRow> = {};
    l.forEach((r) => {
      const cid = r.creator_id as string;
      if (!cid) return;
      if (!creatorMap[cid]) {
        creatorMap[cid] = { creator_id: cid, name: cid.slice(0, 8), produto: (r.produto_nome as string) ?? (r.produto_id as string) ?? "—", clicks: 0, vendas: 0, comissao: 0, ativo: true };
      }
      creatorMap[cid].clicks += (r.cliques as number) ?? 0;
    });
    v.forEach((r: Record<string, string | number>) => {
      const cid = r.creator_id as string;
      if (!cid) return;
      if (!creatorMap[cid]) creatorMap[cid] = { creator_id: cid, name: cid.slice(0, 8), produto: (r.produto_id as string) ?? "—", clicks: 0, vendas: 0, comissao: 0, ativo: true };
      creatorMap[cid].vendas++;
      creatorMap[cid].comissao += (r.comissao_creator as number) ?? 0;
    });
    setCreators(Object.values(creatorMap));

    // Products table — clicks from links_afiliados, sales from vendas
    const prodMap: Record<string, ProductRow> = {};
    const prodCreators: Record<string, Set<string>> = {};
    l.forEach((r) => {
      const k = (r.produto_id as string) ?? "sem-produto";
      if (!prodMap[k]) prodMap[k] = { produto_id: k, nome: (r.produto_nome as string) ?? k, creators: 0, clicks: 0, vendas: 0, gmv: 0, comissao: 0 };
      prodMap[k].clicks += (r.cliques as number) ?? 0;
      if (r.creator_id) {
        if (!prodCreators[k]) prodCreators[k] = new Set();
        prodCreators[k].add(r.creator_id as string);
      }
    });
    Object.entries(prodCreators).forEach(([pid, set]) => {
      if (prodMap[pid]) prodMap[pid].creators = set.size;
    });
    v.forEach((r: Record<string, string | number>) => {
      const k = (r.produto_id as string) ?? "sem-produto";
      if (!prodMap[k]) prodMap[k] = { produto_id: k, nome: k, creators: 0, clicks: 0, vendas: 0, gmv: 0, comissao: 0 };
      prodMap[k].vendas++;
      prodMap[k].gmv += (r.valor as number) ?? 0;
      prodMap[k].comissao += (r.comissao_creator as number) ?? 0;
    });
    setProducts(Object.values(prodMap));

    setDataLoading(false);
  }, [since, period]);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/mundo-mapping/empresa/login"; return; }
      setUserId(user.id);

      const { data: profile } = await supabase.from("profiles").select("plano").eq("id", user.id).maybeSingle();
      const p = (profile?.plano ?? "associate") as Plan;
      setPlan(p);
      setPageLoading(false);

      if (p !== "associate") {
        await fetchData(user.id);

        // Realtime subscription for new vendas
        const channel = supabase.channel("relatorio-rt")
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "vendas", filter: `empresa_id=eq.${user.id}` },
            () => fetchData(user.id))
          .subscribe();

        return () => { supabase.removeChannel(channel); };
      }
    }
    init();
  }, [fetchData]);

  useEffect(() => {
    if (userId && plan !== "associate") fetchData(userId);
  }, [period, userId, plan, fetchData]);

  if (pageLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-16 w-80" />
        <div className="grid grid-cols-4 gap-4">
          {[0,1,2,3].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (plan === "associate") {
    return (
      <>
        <PageHeader eyebrow="Mundo Mapping / Afiliados" title="Relatório de campanhas" description="Métricas detalhadas de cliques, vendas e performance por creator." />
        <UpgradeWall plan={plan} onUpgrade={() => setUpgradeOpen(true)} />
        {upgradeOpen && <UpgradeModal currentPlan={plan} onClose={() => setUpgradeOpen(false)} />}
      </>
    );
  }

  const periodOptions: { label: string; value: Period }[] = [
    { label: "7 dias", value: "7" },
    { label: "30 dias", value: "30" },
    { label: "90 dias", value: "90" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Mundo Mapping / Afiliados"
        title="Relatório de campanhas"
        description="Métricas em tempo real de cliques, vendas e comissões geradas pelos seus afiliados."
        actions={
          <div className="inline-flex rounded-full border border-zinc-200 bg-white p-1">
            {periodOptions.map(opt => (
              <button
                className={`rounded-full px-3 py-2 text-sm font-semibold transition ${period === opt.value ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"}`}
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="space-y-6 p-6">
        {/* Metric cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon="🖱️" label="Total de cliques" loading={dataLoading} sub="Links de afiliado" value={metrics.totalClicks.toLocaleString("pt-BR")} />
          <MetricCard icon="🛒" label="Total de vendas" loading={dataLoading} sub="Todas confirmadas" value={metrics.totalVendas.toLocaleString("pt-BR")} />
          <MetricCard icon="💰" label="Comissões pagas" loading={dataLoading} sub="Para os creators" value={fmtBRL(metrics.totalComissao)} />
          <MetricCard icon="👥" label="Creators ativos" loading={dataLoading} sub="Com cliques ou vendas" value={metrics.activeCreators.toLocaleString("pt-BR")} />
        </div>

        {/* Timeline chart */}
        <SectionCard title="Desempenho ao longo do tempo" subtitle={`Últimos ${period} dias — atualização em tempo real`}>
          {dataLoading ? <Skeleton className="h-52" /> : <DualLineChart data={timeline} />}
        </SectionCard>

        {/* Creators table */}
        <SectionCard title="Creators ativos" subtitle="Performance individual de cada afiliado">
          {dataLoading ? <Skeleton className="h-40" /> : creators.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">Nenhum creator com atividade no período.</p>
          ) : (
            <div className="overflow-hidden rounded-[20px] border border-zinc-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200 text-left">
                  <thead className="bg-zinc-50">
                    <tr>
                      {["Creator", "Produto", "Cliques", "Vendas", "Comissão", "Status"].map(col => (
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500" key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white">
                    {creators.map(r => (
                      <tr className="hover:bg-zinc-50" key={r.creator_id}>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600">
                              {r.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-zinc-900">{r.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-zinc-600">{r.produto}</td>
                        <td className="px-4 py-4 text-sm text-zinc-700">{r.clicks.toLocaleString("pt-BR")}</td>
                        <td className="px-4 py-4 text-sm text-zinc-700">{r.vendas.toLocaleString("pt-BR")}</td>
                        <td className="px-4 py-4 text-sm text-zinc-700">{fmtBRL(r.comissao)}</td>
                        <td className="px-4 py-4">
                          <StatusBadge label={r.ativo ? "Ativo" : "Inativo"} tone={r.ativo ? "success" : "neutral"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Products table */}
        <SectionCard title="Performance por produto" subtitle="Consolidado de cliques e vendas por produto">
          {dataLoading ? <Skeleton className="h-40" /> : products.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">Nenhum produto com atividade no período.</p>
          ) : (
            <div className="overflow-hidden rounded-[20px] border border-zinc-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200 text-left">
                  <thead className="bg-zinc-50">
                    <tr>
                      {["Produto", "Creators", "Cliques", "Vendas", "GMV", "Comissão"].map(col => (
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500" key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white">
                    {products.map(r => (
                      <tr className="hover:bg-zinc-50" key={r.produto_id}>
                        <td className="px-4 py-4 text-sm font-medium text-zinc-900">{r.nome}</td>
                        <td className="px-4 py-4 text-sm text-zinc-700">{r.creators}</td>
                        <td className="px-4 py-4 text-sm text-zinc-700">{r.clicks.toLocaleString("pt-BR")}</td>
                        <td className="px-4 py-4 text-sm text-zinc-700">{r.vendas.toLocaleString("pt-BR")}</td>
                        <td className="px-4 py-4 text-sm text-zinc-700">{fmtBRL(r.gmv)}</td>
                        <td className="px-4 py-4 text-sm text-zinc-700">{fmtBRL(r.comissao)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </>
  );
}
