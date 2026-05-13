"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  MetricCard,
  PageHeader,
  PeriodSwitch,
  ProductVisualCard,
  SectionCard,
  StatusBadge
} from "@/components/mundo-mapping/affiliate-ui";
import { useProductStore } from "@/components/mundo-mapping/product-store";
import { usePlanLimits } from "@/components/mundo-mapping/use-plan-limits";
import { createClient } from "@/lib/supabase/client";

export function ProductDashboard() {
  const { products, ready } = useProductStore();
  const { atLimit, planLabel } = usePlanLimits();
  const [period, setPeriod] = useState("30 dias");
  const [realAffiliates, setRealAffiliates] = useState<number | null>(null);
  const [realComissao, setRealComissao] = useState<number | null>(null);

  const publishedCount = products.filter((p) => p.status === "published").length;
  const shoppingCount = products.filter((p) => p.visibleInShopping).length;
  const avgCreatorScore = products.length
    ? Math.round(products.reduce((t, p) => t + p.minimumCreatorScore, 0) / products.length)
    : 0;

  useEffect(() => {
    async function fetchMetrics() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: linksData }, { data: vendasData }] = await Promise.all([
        supabase.from("links_afiliados").select("creator_id").eq("empresa_id", user.id).eq("ativo", true),
        supabase.from("vendas").select("comissao").eq("empresa_id", user.id),
      ]);

      const uniqueCreators = new Set((linksData ?? []).map((l) => l.creator_id)).size;
      const comissaoTotal = (vendasData ?? []).reduce((s, v) => s + (v.comissao ?? 0), 0);

      setRealAffiliates(uniqueCreators);
      setRealComissao(comissaoTotal);
    }
    fetchMetrics();
  }, []);

  const affiliatesLabel = realAffiliates === null ? "…" : String(realAffiliates);
  const comissaoLabel =
    realComissao === null
      ? "…"
      : `R$ ${realComissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <>
      <PageHeader
        actions={
          <>
            <PeriodSwitch onChange={setPeriod} options={["Hoje", "7 dias", "30 dias"]} value={period} />
            {atLimit ? (
              <div className="flex flex-col items-end gap-1">
                <span className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-xl bg-zinc-200 px-4 text-sm font-semibold text-zinc-400">
                  Criar produto
                </span>
                <p className="text-xs text-zinc-500">
                  Limite do plano <span className="font-semibold">{planLabel}</span> atingido —{" "}
                  <a className="font-semibold text-red-600 hover:underline" href="/mundo-mapping/afiliados/perfil">
                    faça upgrade
                  </a>
                </p>
              </div>
            ) : (
              <Link
                className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-[0_18px_40px_-25px_rgba(220,38,38,0.95)]"
                href="/mundo-mapping/afiliados/produtos/novo"
              >
                Criar produto
              </Link>
            )}
          </>
        }
        description="Leitura executiva do catálogo cadastrado pela empresa, com foco em produto, afiliação e vendas geradas pelos links dos influenciadores."
        eyebrow="Mundo Mapping / Afiliados / Dashboard empresa"
        title="Cockpit de produtos"
      />

      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard emphasis label="Produtos ativos" meta="Publicados pela empresa" value={`${publishedCount}`} />
          <MetricCard label="Creators afiliados" meta="Com link ativo para seus produtos" value={affiliatesLabel} />
          <MetricCard label="Produtos no shopping" meta="Visíveis para afiliação" value={`${shoppingCount}`} />
          <MetricCard label="Comissão gerada" meta="Total histórico para creators" value={comissaoLabel} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
          {/* Products list */}
          <SectionCard subtitle="Visão objetiva do catálogo criado pela empresa." title="Produtos cadastrados">
            {!ready ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-28 animate-pulse rounded-2xl bg-zinc-100" />
                ))}
              </div>
            ) : products.length ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {products.slice(0, 4).map((product) => (
                  <Link href={`/mundo-mapping/afiliados/produtos/${product.slug}`} key={product.id}>
                    <ProductVisualCard
                      commission={
                        product.commissionType === "percent"
                          ? `${product.commissionValue}% por venda`
                          : `R$ ${product.commissionValue.toFixed(2)} por venda`
                      }
                      price={`R$ ${product.price.toFixed(2)}`}
                      status={product.visibleInShopping ? "Público" : "Privado"}
                      title={product.name}
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-500">
                Nenhum produto criado ainda. Use o botão "Criar produto" para iniciar.
              </div>
            )}
          </SectionCard>

          {/* Operational info */}
          <SectionCard subtitle="Como a plataforma funciona." title="Leitura operacional">
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Modelo comercial</p>
                <p className="mt-2 text-sm leading-6 text-zinc-700">
                  A empresa cadastra o produto. O link de venda pertence ao influenciador afiliado. Cada clique é rastreado pelo código único do creator.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Score médio mínimo exigido</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-950">{avgCreatorScore}/100</p>
              </div>
              <Link
                className="inline-flex text-sm font-semibold text-red-700"
                href="/mundo-mapping/afiliados/relatorio"
              >
                Ver relatório detalhado →
              </Link>
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
