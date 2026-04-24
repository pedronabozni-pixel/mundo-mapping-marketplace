"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  LineChart,
  MetricCard,
  PageHeader,
  PeriodSwitch,
  ProductVisualCard,
  SectionCard,
  StatusBadge
} from "@/components/mundo-mapping/affiliate-ui";
import { useProductStore } from "@/components/mundo-mapping/product-store";

export function ProductDashboard() {
  const { products } = useProductStore();
  const [period, setPeriod] = useState("30 dias");
  const publishedCount = products.filter((product) => product.status === "published").length;
  const shoppingCount = products.filter((product) => product.visibleInShopping).length;
  const totalGMV = products.reduce((total, product) => total + product.price * (product.status === "published" ? 24 : 8), 0);
  const draftCount = products.filter((product) => product.status === "draft").length;
  const activeAffiliates = products.filter((product) => product.status === "published").reduce((total, product) => total + (product.visibleInShopping ? 18 : 8), 0);
  const avgCreatorScore = products.length ? Math.round(products.reduce((total, product) => total + product.minimumCreatorScore, 0) / products.length) : 0;
  const chartConfig = useMemo(() => {
    if (period === "Hoje") {
      return {
        labels: ["08h", "10h", "12h", "14h", "16h", "18h", "20h"],
        values: [22, 30, 28, 42, 49, 57, 54]
      };
    }

    if (period === "7 dias") {
      return {
        labels: ["seg", "ter", "qua", "qui", "sex", "sab", "dom"],
        values: [48, 62, 58, 71, 76, 69, 84]
      };
    }

    return {
      labels: ["abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez", "jan", "fev", "mar"],
      values: [42, 48, 64, 60, 78, 92, 88, 106, 114, 128, 123, 140]
    };
  }, [period]);

  return (
    <>
      <PageHeader
        actions={
          <>
            <PeriodSwitch onChange={setPeriod} options={["Hoje", "7 dias", "30 dias"]} value={period} />
            <Link className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-[0_18px_40px_-25px_rgba(220,38,38,0.95)]" href="/mundo-mapping/afiliados/produtos/novo">
              Criar produto
            </Link>
          </>
        }
        description="Leitura executiva do catálogo cadastrado pela empresa, com foco em produto, afiliação e vendas geradas pelos links dos influenciadores."
        eyebrow="Mundo Mapping / Afiliados / Dashboard empresa"
        title="Cockpit de produtos"
      />

      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard emphasis label="Produtos ativos" meta="Publicados pela empresa" value={`${publishedCount}`} />
          <MetricCard label="Afiliados ativos" meta="Influenciadores com link próprio" value={`${activeAffiliates}`} />
          <MetricCard label="Produtos no shopping" meta="Visíveis para afiliação" value={`${shoppingCount}`} />
          <MetricCard label="GMV estimado" meta="Gerado pelos afiliados" value={`R$ ${totalGMV.toFixed(0)}`} />
        </div>

        <SectionCard
          action={<StatusBadge label={`Período: ${period}`} tone="success" />}
          subtitle="Tendência comercial mais limpa, mostrando a evolução do canal sem excesso de blocos."
          title="Desempenho do canal"
        >
          <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
            <LineChart labels={chartConfig.labels} values={chartConfig.values} />
            <div className="rounded-[22px] border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-sm font-medium text-zinc-500">Leitura operacional</p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Base Mundo Mapping</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-700">A operação parte de uma base validada com mais de 16 mil creators, e cada produto define score mínimo e critérios de elegibilidade.</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Modelo comercial</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-700">A empresa cadastra o produto. O link de venda pertence ao influenciador afiliado.</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Próxima ação</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-700">Priorize publicar produtos com checkout revisado, criativos aprovados e comissão definida.</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Score médio mínimo exigido</p>
                  <p className="mt-2 text-2xl font-semibold text-zinc-950">{avgCreatorScore}/100</p>
                </div>
                <Link className="inline-flex text-sm font-semibold text-red-700" href="/mundo-mapping/afiliados/produtos/novo">
                  Abrir criação de produto
                </Link>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard subtitle="Visão objetiva do catálogo criado pela empresa." title="Produtos cadastrados">
          {products.length ? (
            <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {products.slice(0, 3).map((product) => (
                <div key={product.id}>
                  <Link href={`/mundo-mapping/afiliados/produtos/${product.slug}`}>
                    <ProductVisualCard
                      commission={product.commissionType === "percent" ? `${product.commissionValue}% por venda` : `R$ ${product.commissionValue.toFixed(2)} por venda`}
                      price={`R$ ${product.price.toFixed(2)}`}
                      status={product.visibleInShopping ? "Público" : "Privado"}
                      title={product.name}
                    />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-500">
              Nenhum produto criado ainda. Use o botão "Criar produto" para iniciar.
            </div>
          )}
        </SectionCard>
      </div>
    </>
  );
}
