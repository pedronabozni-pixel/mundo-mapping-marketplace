"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SectionCard, StatusBadge } from "@/components/mundo-mapping/affiliate-ui";

// ─── Types ────────────────────────────────────────────────────────────────────

type DashData = {
  linksAtivos: number;
  totalCliques: number;
  totalVendas: number;
  comissaoAcumulada: number;
  userName: string | null;
};

type RecentLink = {
  id: string;
  codigo: string;
  produto_nome: string;
  cliques: number;
  ativo: boolean;
};

type AvailableProduct = {
  id: string;
  nome: string;
  empresa_nome: string | null;
  preco: number;
  comissao_tipo: "percent" | "fixed";
  comissao_valor: number;
};

type SparkPoint = { day: string; valor: number };

// ─── Sparkline SVG ────────────────────────────────────────────────────────────

function Sparkline({ data }: { data: SparkPoint[] }) {
  if (!data.length || data.every((p) => p.valor === 0)) {
    return (
      <p className="italic text-sm" style={{ color: "#555" }}>
        Gráfico aparece a partir da primeira venda
      </p>
    );
  }
  const W = 320;
  const H = 100;
  const max = Math.max(...data.map((p) => p.valor), 1);
  const step = W / Math.max(data.length - 1, 1);
  const pts = data
    .map((p, i) => `${i * step},${H - (p.valor / max) * (H - 16) - 8}`)
    .join(" ");
  const lastX = (data.length - 1) * step;

  return (
    <svg className="h-full w-full" preserveAspectRatio="none" viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id="inf-spark" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#C8102E" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#C8102E" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill="url(#inf-spark)" points={`0,${H} ${pts} ${lastX},${H}`} />
      <polyline fill="none" points={pts} stroke="#C8102E" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
    </svg>
  );
}

// ─── PeriodSwitch mini ─────────────────────────────────────────────────────────

type Period = "hoje" | "7d" | "30d";

function PeriodSwitchMini({ value, onChange }: { value: Period; onChange: (v: Period) => void }) {
  const opts: { label: string; value: Period }[] = [
    { label: "Hoje", value: "hoje" },
    { label: "7d", value: "7d" },
    { label: "30d", value: "30d" },
  ];
  return (
    <div
      className="inline-flex rounded-lg p-[3px]"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {opts.map((o) => (
        <button
          className="rounded-md px-3 py-1.5 text-xs font-medium transition"
          key={o.value}
          onClick={() => onChange(o.value)}
          style={value === o.value ? { background: "rgba(255,255,255,0.08)", color: "#fff" } : { color: "#666" }}
          type="button"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── InfluencerHome ───────────────────────────────────────────────────────────

export function InfluencerHome() {
  const [dash, setDash] = useState<DashData | null>(null);
  const [recentLinks, setRecentLinks] = useState<RecentLink[]>([]);
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
  const [sparkData, setSparkData] = useState<SparkPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: profileData }, { data: linksData }, { data: vendasData }, { data: recentLinksData }, { data: produtosData }] =
      await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).single(),
        supabase.from("links_afiliados").select("cliques, ativo, produto_id").eq("creator_id", user.id),
        supabase.from("vendas").select("comissao, comissao_creator, criado_em").eq("creator_id", user.id),
        supabase
          .from("links_afiliados")
          .select("id, codigo, produto_nome, cliques, ativo")
          .eq("creator_id", user.id)
          .order("criado_em", { ascending: false })
          .limit(3),
        supabase
          .from("produtos")
          .select("id, nome, empresa_nome, preco, comissao_tipo, comissao_valor")
          .eq("status", "published")
          .eq("visivel_shopping", true)
          .order("comissao_valor", { ascending: false })
          .limit(4),
      ]);

    const links = linksData ?? [];
    const linksAtivos = links.filter((l) => l.ativo).length;
    const totalCliques = links.reduce((s, l) => s + (l.cliques ?? 0), 0);
    const vendas = vendasData ?? [];
    const totalVendas = vendas.length;
    const comissaoAcumulada = vendas.reduce((s, v) => s + ((v.comissao_creator ?? v.comissao ?? 0) as number), 0);

    // Sparkline: group by day last 30 days
    const now = new Date();
    const dayMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayMap[key] = 0;
    }
    vendas.forEach((v) => {
      if (!v.criado_em) return;
      const key = (v.criado_em as string).slice(0, 10);
      if (key in dayMap) dayMap[key] += (v.comissao_creator ?? v.comissao ?? 0) as number;
    });
    const spark = Object.entries(dayMap).map(([day, valor]) => ({ day, valor }));
    setSparkData(spark);

    // Available products: exclude those the creator already has links for
    const myProductIds = new Set(links.map((l) => l.produto_id).filter(Boolean));
    const available = ((produtosData ?? []) as AvailableProduct[]).filter(
      (p) => !myProductIds.has(p.id)
    );

    setDash({ linksAtivos, totalCliques, totalVendas, comissaoAcumulada, userName: profileData?.full_name ?? null });
    setRecentLinks((recentLinksData ?? []) as RecentLink[]);
    setAvailableProducts(available);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#C8102E] border-t-transparent" />
      </div>
    );
  }

  const comissao = dash?.comissaoAcumulada ?? 0;
  const [intPart, decPart] = fmtBRL(comissao).split(",");
  const greeting = dash?.userName ? `Olá, ${dash.userName.split(" ")[0]}` : "Olá";

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: "#555" }}>
            Painel · {period}
          </p>
          <h1 className="mt-1 font-sans text-[28px] font-extrabold tracking-[-0.02em] text-white leading-tight">{greeting}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PeriodSwitchMini value={period} onChange={setPeriod} />
          <Link
            className="inline-flex items-center gap-2 rounded-xl bg-[#C8102E] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_-10px_rgba(200,16,46,0.7)] transition hover:bg-[#A30D24]"
            href="/mundo-mapping/influenciadores/shopping"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" x2="21" y1="6" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            Ir ao shopping
          </Link>
        </div>
      </div>

      {/* ── Hero card ─────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden rounded-[18px] p-6 sm:p-7"
        style={{
          background: "linear-gradient(135deg, rgba(200,16,46,0.08) 0%, rgba(200,16,46,0.02) 60%, transparent 100%)",
          border: "1px solid rgba(200,16,46,0.15)",
        }}
      >
        {/* Decorative radial glow */}
        <div
          className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(200,16,46,0.12) 0%, transparent 70%)" }}
        />

        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          {/* Left: big number + stats */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: "#C8102E" }}>
              Ganhos totais · no bolso
            </p>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-sans text-[40px] font-extrabold tracking-[-0.02em] leading-none text-white sm:text-[48px]">
                R$ {intPart ?? "0"}
              </span>
              <span className="font-sans text-[22px] font-extrabold tracking-[-0.02em] leading-none" style={{ color: "#888" }}>
                ,{decPart ?? "00"}
              </span>
            </div>

            {/* Inline stats */}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: "#555" }}>Links ativos</span>
                <span className="text-sm font-semibold text-white">{dash?.linksAtivos ?? 0}</span>
              </div>
              <div className="h-3 w-px" style={{ background: "rgba(255,255,255,0.1)" }} />
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: "#555" }}>Vendas</span>
                <span className="text-sm font-semibold text-white">{dash?.totalVendas ?? 0}</span>
              </div>
              <div className="h-3 w-px" style={{ background: "rgba(255,255,255,0.1)" }} />
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: "#555" }}>Cliques</span>
                <span className="text-sm font-semibold text-white">{(dash?.totalCliques ?? 0).toLocaleString("pt-BR")}</span>
              </div>
            </div>
          </div>

          {/* Right: sparkline */}
          <div className="hidden h-24 items-end lg:flex">
            <Sparkline data={sparkData} />
          </div>
        </div>
      </section>

      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* Left: Discover products */}
        <section
          className="rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-sans text-[20px] font-extrabold tracking-[-0.01em] text-white">Descobrir produtos</h3>
              <p className="mt-1 text-[12px]" style={{ color: "#666" }}>Para promover com seu link</p>
            </div>
            <Link
              className="shrink-0 text-[12px] transition hover:text-white"
              href="/mundo-mapping/influenciadores/shopping"
              style={{ color: "#888" }}
            >
              Ver shopping completo →
            </Link>
          </div>

          {availableProducts.length === 0 ? (
            <div
              className="rounded-2xl px-6 py-10 text-center text-sm"
              style={{ border: "1px dashed rgba(255,255,255,0.06)", color: "#555" }}
            >
              Nenhum produto disponível para promover no momento.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {availableProducts.map((p) => {
                const comissaoCalc =
                  p.comissao_tipo === "percent"
                    ? `${p.comissao_valor}%`
                    : `R$ ${p.comissao_valor.toFixed(2)}`;
                const valorCalc =
                  p.comissao_tipo === "percent"
                    ? (p.preco * p.comissao_valor) / 100
                    : p.comissao_valor;

                return (
                  <Link
                    className="group block rounded-[14px] p-[14px] transition"
                    href="/mundo-mapping/influenciadores/shopping"
                    key={p.id}
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)")}
                  >
                    {/* Thumb */}
                    <div
                      className="relative mb-3 overflow-hidden rounded-[10px]"
                      style={{ height: 110, background: "linear-gradient(135deg,#1a1a1a 0%,#0f0f0f 100%)", border: "1px solid rgba(200,16,46,0.1)" }}
                    >
                      <span
                        className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                        style={{ background: "rgba(200,16,46,0.15)", color: "#C8102E" }}
                      >
                        {comissaoCalc} comissão
                      </span>
                      <div
                        className="absolute bottom-3 left-3 rounded-[6px]"
                        style={{ width: 32, height: 32, background: "rgba(200,16,46,0.2)" }}
                      />
                    </div>

                    {p.empresa_nome && (
                      <p className="text-[11px] font-semibold uppercase tracking-[0.04em]" style={{ color: "#666" }}>
                        {p.empresa_nome}
                      </p>
                    )}
                    <p className="mt-1 text-[14px] font-medium text-white leading-snug">{p.nome}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-sans text-[18px] font-extrabold tracking-[-0.01em] text-white">R$ {p.preco.toFixed(2)}</span>
                      <span className="text-[12px] font-medium" style={{ color: "#4ADE80" }}>
                        +R$ {valorCalc.toFixed(2)} por venda
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Right: sidebar cards */}
        <div className="space-y-4">
          {/* Card 1: Recent links */}
          <section
            className="rounded-[16px] p-5"
            style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-sans text-[16px] font-bold tracking-[-0.01em] text-white">Meus links ativos</h3>
              <Link
                className="text-[11px] transition hover:text-white"
                href="/mundo-mapping/influenciadores/meus-links"
                style={{ color: "#888" }}
              >
                Ver todos →
              </Link>
            </div>

            {recentLinks.length === 0 ? (
              <p className="text-[12px]" style={{ color: "#555" }}>
                Você ainda não tem links ativos. Vá ao shopping para criar o primeiro.
              </p>
            ) : (
              <div className="space-y-2">
                {recentLinks.map((l) => (
                  <div
                    className="rounded-[10px] p-3"
                    key={l.id}
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[12px] font-medium text-white">{l.produto_nome}</p>
                      <StatusBadge label={l.ativo ? "Ativo" : "Inativo"} tone={l.ativo ? "success" : "warning"} />
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px]" style={{ color: "#666" }}>
                      <span>{l.cliques.toLocaleString("pt-BR")} cliques</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Card 2: Próximo saque */}
          <section
            className="rounded-[16px] p-5"
            style={{
              background: "linear-gradient(135deg, rgba(74,222,128,0.06) 0%, transparent 100%)",
              border: "1px solid rgba(74,222,128,0.15)",
            }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "#4ADE80" }}>
              Próximo saque
            </p>
            {comissao > 0 ? (
              <>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-sans text-[28px] font-extrabold tracking-[-0.02em] text-white">R$ {intPart}</span>
                  <span className="font-sans text-[16px] font-extrabold tracking-[-0.01em]" style={{ color: "#888" }}>,{decPart}</span>
                </div>
                <p className="mt-1 text-[11px]" style={{ color: "#888" }}>
                  Disponível para saque
                </p>
              </>
            ) : (
              <p className="mt-3 font-sans text-[28px] font-extrabold tracking-[-0.02em] text-white">R$ —</p>
            )}
            <Link
              className="mt-4 flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-[12px] font-medium transition"
              href="/mundo-mapping/influenciadores/financeiro"
              style={{
                background: "rgba(74,222,128,0.12)",
                color: "#4ADE80",
                border: "1px solid rgba(74,222,128,0.2)",
              }}
            >
              Ver financeiro →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}

// ─── Static sections (dark mode) ─────────────────────────────────────────────

export function InfluencerLinksSection() {
  return (
    <SectionCard
      action={
        <Link
          className="inline-flex rounded-xl px-3 py-2 text-sm font-semibold text-white transition"
          href="/mundo-mapping/influenciadores/meus-links"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          Ver dados reais
        </Link>
      }
      subtitle="Acesse 'Meus links' no menu para ver seus links com dados reais do Supabase."
      title="Meus links de afiliado"
    >
      <div
        className="rounded-2xl px-6 py-10 text-center text-sm"
        style={{ border: "1px dashed rgba(255,255,255,0.06)", color: "#555" }}
      >
        Esta página foi substituída por{" "}
        <Link className="font-semibold text-[#C8102E] underline-offset-2 hover:underline" href="/mundo-mapping/influenciadores/meus-links">
          Meus links
        </Link>
        , que exibe dados reais do Supabase.
      </div>
    </SectionCard>
  );
}

export function InfluencerProductsSection() {
  return (
    <SectionCard
      action={
        <Link
          className="inline-flex rounded-xl px-3 py-2 text-sm font-semibold text-white transition"
          href="/mundo-mapping/influenciadores/shopping"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          Buscar produtos
        </Link>
      }
      subtitle="Produtos disponíveis para afiliação."
      title="Produtos afiliados"
    >
      <div
        className="rounded-2xl px-6 py-12 text-center"
        style={{ border: "1px dashed rgba(255,255,255,0.06)" }}
      >
        <p className="text-sm font-medium text-white">Você ainda não tem produtos afiliados.</p>
        <p className="mt-2 text-sm" style={{ color: "#888" }}>
          Acesse o shopping e solicite afiliação aos produtos disponíveis.
        </p>
        <Link
          className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-[#C8102E] px-5 text-sm font-bold text-white shadow-[0_8px_24px_-10px_rgba(200,16,46,0.7)] transition hover:bg-[#A30D24]"
          href="/mundo-mapping/influenciadores/shopping"
        >
          Ir para o shopping
        </Link>
      </div>
    </SectionCard>
  );
}

export function InfluencerMaterialsSection() {
  return (
    <SectionCard
      action={
        <Link
          className="inline-flex rounded-xl px-3 py-2 text-sm font-semibold text-white transition"
          href="/mundo-mapping/influenciadores/meus-links"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          Ver produtos afiliados
        </Link>
      }
      subtitle="Materiais liberados pela empresa ou produtor para cada produto aprovado na sua operação."
      title="Biblioteca de materiais"
    >
      <div
        className="rounded-2xl px-6 py-12 text-center"
        style={{ border: "1px dashed rgba(255,255,255,0.06)" }}
      >
        <p className="text-sm font-medium text-white">Nenhum material disponível ainda.</p>
        <p className="mt-2 text-sm" style={{ color: "#888" }}>
          Quando a empresa ou produtor liberar materiais para os seus produtos afiliados, eles aparecerão aqui.
        </p>
      </div>
    </SectionCard>
  );
}

export function InfluencerFinanceSection() {
  return (
    <SectionCard subtitle="Resumo financeiro do influenciador." title="Financeiro">
      <div
        className="rounded-2xl px-6 py-12 text-center"
        style={{ border: "1px dashed rgba(255,255,255,0.06)" }}
      >
        <p className="text-sm font-medium text-white">Módulo financeiro em construção.</p>
        <p className="mt-2 text-sm" style={{ color: "#888" }}>
          Acompanhe seus cliques e links em{" "}
          <Link className="font-semibold text-[#C8102E]" href="/mundo-mapping/influenciadores/meus-links">
            Meus links
          </Link>
          .
        </p>
      </div>
    </SectionCard>
  );
}
