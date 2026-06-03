"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PeriodSwitch } from "@/components/mundo-mapping/affiliate-ui";
import { useProductStore } from "@/components/mundo-mapping/product-store";
import { usePlanLimits } from "@/components/mundo-mapping/use-plan-limits";
import { createClient } from "@/lib/supabase/client";

// ─── Sparkline SVG (dados reais de vendas dos últimos 30 dias) ───────────────

const SPARK_W = 320;
const SPARK_H = 120;

function buildSparkPoints(data: number[]) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(max - min, 1);
  const step = SPARK_W / Math.max(data.length - 1, 1);
  return data.map((v, i) => ({
    x: i * step,
    y: SPARK_H - ((v - min) / range) * (SPARK_H - 20) - 10,
  }));
}

function Sparkline({ values }: { values: number[] }) {
  const hasData = values.length > 0 && values.some((v) => v > 0);

  if (!hasData) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[12px] italic text-center" style={{ color: "#555" }}>
          Gráfico aparece a partir da primeira venda
        </p>
      </div>
    );
  }

  const pts = buildSparkPoints(values);
  const polyPts = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const last = pts[pts.length - 1];

  return (
    <svg
      fill="none"
      preserveAspectRatio="none"
      style={{ width: "100%", height: 100 }}
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
    >
      <defs>
        <linearGradient id="sparkGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#C8102E" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#C8102E" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        fill="url(#sparkGrad)"
        points={`0,${SPARK_H} ${polyPts} ${SPARK_W},${SPARK_H}`}
      />
      <polyline
        fill="none"
        points={polyPts}
        stroke="#C8102E"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
      <circle
        cx={last.x}
        cy={last.y}
        fill="#fff"
        r="4"
        stroke="#C8102E"
        strokeWidth="2"
      />
    </svg>
  );
}

// ─── Skeleton product card ────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="animate-pulse rounded-[14px]"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)", height: 188 }}
    />
  );
}

// ─── Dark product card ────────────────────────────────────────────────────────

function DarkProductCard({
  slug,
  name,
  price,
  commissionType,
  commissionValue,
  visibleInShopping,
}: {
  slug: string;
  name: string;
  price: number;
  commissionType: "percent" | "fixed";
  commissionValue: number;
  visibleInShopping: boolean;
}) {
  const isPublic = visibleInShopping;
  const commissionLabel =
    commissionType === "percent"
      ? `${commissionValue}% comissão`
      : `R$ ${commissionValue.toFixed(2)} comissão`;

  return (
    <Link href={`/mundo-mapping/afiliados/produtos/${slug}`}>
      <article
        className="rounded-[14px] p-4 transition-colors cursor-pointer"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)")
        }
      >
        {/* Thumb */}
        <div
          className="relative mb-3 rounded-[10px]"
          style={{
            height: 80,
            background: "linear-gradient(135deg,#1a1a1a 0%,#0f0f0f 100%)",
            border: "1px solid rgba(200,16,46,0.1)",
          }}
        >
          {/* Status badge */}
          <span
            className="absolute right-2 top-2 rounded text-[9px] font-semibold uppercase px-[7px] py-[3px]"
            style={
              isPublic
                ? { background: "rgba(74,222,128,0.12)", color: "#4ADE80" }
                : { background: "rgba(251,191,36,0.12)", color: "#FBBF24" }
            }
          >
            {isPublic ? "Público" : "Privado"}
          </span>
          {/* Decorative square */}
          <div
            className="absolute bottom-2 left-2 rounded-md"
            style={{ width: 32, height: 32, background: "rgba(200,16,46,0.2)" }}
          />
        </div>

        {/* Name */}
        <p
          className="mb-2 text-[13px] font-medium text-white leading-[1.4]"
          style={{ minHeight: "2.8em" }}
        >
          {name}
        </p>

        {/* Price + commission */}
        <div className="flex items-baseline justify-between mb-3">
          <span className="font-serif text-[18px] font-medium text-white">
            {`R$ ${price.toFixed(2)}`}
          </span>
          <span className="text-[11px] font-medium" style={{ color: "#C8102E" }}>
            {commissionLabel}
          </span>
        </div>

        {/* Footer stats */}
        <div
          className="flex gap-3 pt-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <div>
            <p className="text-[10px]" style={{ color: "#555" }}>Afiliados</p>
            <p className="text-[12px] font-medium" style={{ color: "#aaa" }}>—</p>
          </div>
          <div>
            <p className="text-[10px]" style={{ color: "#555" }}>Vendas</p>
            <p className="text-[12px] font-medium" style={{ color: "#aaa" }}>—</p>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export function ProductDashboard() {
  const { products, ready } = useProductStore();
  const { atLimit, planLabel } = usePlanLimits();
  const [period, setPeriod] = useState("30 dias");
  const [realAffiliates, setRealAffiliates] = useState<number | null>(null);
  const [realComissao, setRealComissao] = useState<number | null>(null);
  const [walletMissing, setWalletMissing] = useState(false);
  const [empresaName, setEmpresaName] = useState<string | null>(null);
  const [sparklineValues, setSparklineValues] = useState<number[]>([]);
  const [vendas30dCount, setVendas30dCount] = useState<number | null>(null);
  const [vendas30dPrevCount, setVendas30dPrevCount] = useState<number | null>(null);

  const publishedCount = products.filter((p) => p.status === "published").length;

  // Check wallet + fetch empresa name
  useEffect(() => {
    async function checkWallet() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("wallet_id, user_type, full_name")
        .eq("id", user.id)
        .single();
      if (profile?.user_type === "empresa" && !profile.wallet_id) {
        setWalletMissing(true);
      }
      if (profile?.full_name) {
        setEmpresaName(profile.full_name);
      }
    }
    checkWallet();
  }, []);

  // Fetch affiliate + comissão metrics + sparkline data
  useEffect(() => {
    async function fetchMetrics() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = Date.now();
      const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);

      const [
        { data: linksData },
        { data: vendasAll },
        { data: vendas30d },
        { count: prevCount },
      ] = await Promise.all([
        supabase.from("links_afiliados").select("creator_id").eq("empresa_id", user.id).eq("ativo", true),
        supabase.from("vendas").select("comissao").eq("empresa_id", user.id),
        supabase
          .from("vendas")
          .select("comissao, created_at")
          .eq("empresa_id", user.id)
          .gte("created_at", thirtyDaysAgo.toISOString())
          .order("created_at", { ascending: true }),
        supabase
          .from("vendas")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", user.id)
          .gte("created_at", sixtyDaysAgo.toISOString())
          .lt("created_at", thirtyDaysAgo.toISOString()),
      ]);

      const uniqueCreators = new Set((linksData ?? []).map((l) => l.creator_id)).size;
      const comissaoTotal = (vendasAll ?? []).reduce((s, v) => s + (v.comissao ?? 0), 0);

      setRealAffiliates(uniqueCreators);
      setRealComissao(comissaoTotal);

      // Build 30-day sparkline (one sum per day)
      const thirtyDaysAgoMs = thirtyDaysAgo.getTime();
      const dailyValues = Array(30).fill(0) as number[];
      (vendas30d ?? []).forEach((v) => {
        const dayIndex = Math.floor(
          (new Date(v.created_at as string).getTime() - thirtyDaysAgoMs) / 86400000
        );
        if (dayIndex >= 0 && dayIndex < 30) {
          dailyValues[dayIndex] += (v.comissao as number) ?? 0;
        }
      });
      setSparklineValues(dailyValues);
      setVendas30dCount(vendas30d?.length ?? 0);
      setVendas30dPrevCount(prevCount ?? 0);
    }
    fetchMetrics();
  }, []);

  const affiliatesLabel = realAffiliates === null ? "…" : String(realAffiliates);

  // Split commission into integer + decimal for the hero big number
  const comissaoFormatted = useMemo(() => {
    if (realComissao === null) return { int: "…", dec: "" };
    const str = realComissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    const [int, dec] = str.split(",");
    return { int: `R$ ${int}`, dec: `,${dec}` };
  }, [realComissao]);

  // Compute 30d sales trend vs previous period
  const vendasTrend = useMemo(() => {
    if (vendas30dCount === null) return { label: "…", color: "#666" };
    if (vendas30dCount === 0) return { label: "—", color: "#666" };
    if (vendas30dPrevCount === null || vendas30dPrevCount === 0) {
      return { label: String(vendas30dCount), color: "#fff" };
    }
    const pct = Math.round(((vendas30dCount - vendas30dPrevCount) / vendas30dPrevCount) * 100);
    if (pct >= 0) return { label: `+${pct}%`, color: "#4ADE80" };
    return { label: `${pct}%`, color: "#FBBF24" };
  }, [vendas30dCount, vendas30dPrevCount]);

  return (
    <div className="p-7 md:p-8 space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p
            className="text-[11px] uppercase font-medium"
            style={{ letterSpacing: "0.12em", color: "#555" }}
          >
            Cockpit <span style={{ color: "#333" }}>·</span> {period}
          </p>
          <h1 className="mt-1.5 font-serif text-[28px] font-normal text-white leading-tight">
            {empresaName ? `Olá, ${empresaName.split(" ")[0]}` : "Olá"}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PeriodSwitch onChange={setPeriod} options={["Hoje", "7 dias", "30 dias"]} value={period} />
          {atLimit ? (
            <div className="flex flex-col items-end gap-1">
              <span
                className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-lg px-4 text-[14px] font-medium"
                style={{ background: "rgba(255,255,255,0.04)", color: "#555" }}
              >
                Criar produto
              </span>
              <p className="text-[11px]" style={{ color: "#555" }}>
                Limite <span className="font-semibold">{planLabel}</span> atingido —{" "}
                <a className="font-semibold hover:text-white transition-colors" href="/mundo-mapping/afiliados/perfil" style={{ color: "#C8102E" }}>
                  upgrade
                </a>
              </p>
            </div>
          ) : (
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#A30D24]"
              href="/mundo-mapping/afiliados/produtos/novo"
              style={{ background: "#C8102E" }}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={2.5} viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Criar produto
            </Link>
          )}
        </div>
      </div>

      {/* ── Wallet missing banner ── */}
      {walletMissing && (
        <div
          className="flex items-start gap-3 rounded-2xl px-5 py-4"
          style={{
            background: "rgba(251,191,36,0.06)",
            border: "1px solid rgba(251,191,36,0.15)",
          }}
        >
          <svg
            className="mt-0.5 h-5 w-5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            style={{ color: "#FBBF24" }}
            viewBox="0 0 24 24"
          >
            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#FBBF24" }}>
              Conta financeira não configurada
            </p>
            <p className="mt-1 text-sm leading-6" style={{ color: "#f59e0b" }}>
              Seu cadastro financeiro junto ao Asaas não foi criado. Complete seus dados de perfil para poder publicar produtos.{" "}
              <a
                className="font-semibold underline underline-offset-2"
                href="/mundo-mapping/afiliados/perfil"
                style={{ color: "#FBBF24" }}
              >
                Ir para o perfil
              </a>
            </p>
          </div>
        </div>
      )}

      {/* ── Hero card ── */}
      <div
        className="relative overflow-hidden rounded-[20px] p-8"
        style={{
          background: "linear-gradient(135deg, rgba(200,16,46,0.08) 0%, rgba(200,16,46,0.02) 60%, transparent 100%)",
          border: "1px solid rgba(200,16,46,0.15)",
        }}
      >
        {/* Decorative radial */}
        <div
          className="pointer-events-none absolute"
          style={{
            top: -40,
            right: -40,
            width: 240,
            height: 240,
            background: "radial-gradient(circle, rgba(200,16,46,0.12) 0%, transparent 70%)",
          }}
        />

        <div className="relative grid gap-8 md:grid-cols-[1.2fr_1fr]">
          {/* Left: numbers */}
          <div>
            <p
              className="text-[11px] uppercase font-medium"
              style={{ letterSpacing: "0.1em", color: "#C8102E" }}
            >
              Comissão gerada · histórico
            </p>

            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-serif text-[52px] font-normal text-white leading-none md:text-[56px]">
                {comissaoFormatted.int}
              </span>
              {comissaoFormatted.dec && (
                <span className="font-serif text-[28px] font-normal leading-none" style={{ color: "#888" }}>
                  {comissaoFormatted.dec}
                </span>
              )}
            </div>

            {/* Inline stats */}
            <div className="mt-6 flex flex-wrap items-center gap-6">
              <div>
                <p className="text-[12px]" style={{ color: "#666" }}>Produtos ativos</p>
                <p className="mt-0.5 text-[18px] font-medium text-white">{publishedCount}</p>
              </div>
              <div className="h-8 w-px" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div>
                <p className="text-[12px]" style={{ color: "#666" }}>Creators ativos</p>
                <p className="mt-0.5 text-[18px] font-medium text-white">{affiliatesLabel}</p>
              </div>
              <div className="h-8 w-px" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div>
                <p className="text-[12px]" style={{ color: "#666" }}>Vendas (30d)</p>
                <p className="mt-0.5 text-[18px] font-medium" style={{ color: vendasTrend.color }}>
                  {vendasTrend.label}
                </p>
              </div>
            </div>
          </div>

          {/* Right: sparkline */}
          <div className="hidden md:flex md:items-end">
            <Sparkline values={sparklineValues} />
          </div>
        </div>
      </div>

      {/* ── Products section ── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-serif text-[20px] font-normal text-white">Seus produtos</h2>
            <p className="mt-0.5 text-[12px]" style={{ color: "#555" }}>
              A empresa cadastra o produto — o creator recebe o link de afiliado para vender.
            </p>
          </div>
          {products.length > 0 && (
            <Link
              className="text-[12px] transition-colors hover:text-white"
              href="/mundo-mapping/afiliados/produtos"
              style={{ color: "#888" }}
            >
              Ver todos os {products.length} →
            </Link>
          )}
        </div>

        {!ready ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : products.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.slice(0, 6).map((product) => (
              <DarkProductCard
                commissionType={product.commissionType}
                commissionValue={product.commissionValue}
                key={product.id}
                name={product.name}
                price={product.price}
                slug={product.slug}
                visibleInShopping={product.visibleInShopping}
              />
            ))}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center rounded-[20px] px-6 py-14 text-center"
            style={{ border: "1px dashed rgba(255,255,255,0.06)" }}
          >
            <p className="text-[14px]" style={{ color: "#666" }}>Nenhum produto criado ainda.</p>
            {!atLimit && (
              <Link
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#A30D24]"
                href="/mundo-mapping/afiliados/produtos/novo"
                style={{ background: "#C8102E" }}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Criar primeiro produto
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
