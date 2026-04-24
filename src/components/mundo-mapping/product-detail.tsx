"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, MiniStat, PageHeader, SectionCard, StatusBadge } from "@/components/mundo-mapping/affiliate-ui";
import { ProductRecord, useProductStore } from "@/components/mundo-mapping/product-store";

const tabs = ["Visão geral", "Criativos", "Checkout", "Configurações"];

export function ProductDetail({ product }: { product: ProductRecord }) {
  const router = useRouter();
  const { products, setProductStatus, updateProduct } = useProductStore();
  const [activeTab, setActiveTab] = useState("Visão geral");
  const [checkoutDraft, setCheckoutDraft] = useState({
    checkoutColor: product.checkoutColor,
    checkoutHeadline: product.checkoutHeadline,
    checkoutSubheadline: product.checkoutSubheadline,
    checkoutCtaLabel: product.checkoutCtaLabel,
    checkoutGuaranteeText: product.checkoutGuaranteeText,
    checkoutSupportText: product.checkoutSupportText,
    checkoutHighlights: product.checkoutHighlights
  });
  const [checkoutFeedback, setCheckoutFeedback] = useState<string | null>(null);

  const commissionLabel = useMemo(() => {
    if (product.commissionType === "percent") {
      return `${product.commissionValue}%`;
    }
    return `R$ ${product.commissionValue.toFixed(2)}`;
  }, [product.commissionType, product.commissionValue]);

  const statusTone = product.status === "published" ? "success" : product.status === "paused" ? "red" : "warning";

  function saveCheckout() {
    const updated = updateProduct(product.slug, {
      ...product,
      ...checkoutDraft
    });

    if (!updated) {
      setCheckoutFeedback("Não foi possível salvar o checkout.");
      return;
    }

    setCheckoutFeedback("Checkout atualizado com sucesso.");
    router.refresh();
  }

  return (
    <>
      <PageHeader
        actions={
          <>
            <label className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700">
              <span className="font-semibold">Produto</span>
              <select
                className="bg-transparent text-sm font-medium text-zinc-700 outline-none"
                onChange={(event) => router.push(`/mundo-mapping/afiliados/produtos/${event.target.value}`)}
                value={product.slug}
              >
                {products.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700"
              onClick={() => setProductStatus(product.slug, product.status === "paused" ? "published" : "paused")}
              type="button"
            >
              {product.status === "paused" ? "Reativar produto" : "Pausar produto"}
            </button>
            <Link className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700" href={`/mundo-mapping/afiliados/produtos/${product.slug}/editar`}>
              Editar produto
            </Link>
          </>
        }
        description="Hub mais limpo para revisar o produto cadastrado pela empresa, controlar status e acompanhar os influenciadores que recebem links próprios para vender."
        eyebrow={`Mundo Mapping / Afiliados / Produtos / ${product.name}`}
        title="Hub do produto"
      />

      <div className="space-y-6 p-6">
        <SectionCard subtitle="Cabeçalho executivo baseado nos dados salvos no fluxo de criação." title="Resumo do produto">
          <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
            <div className="rounded-[24px] bg-[linear-gradient(145deg,#ffffff_0%,#f5f5f5_40%,#fee2e2_40%,#ffffff_100%)] p-5">
              <div className="flex h-[280px] items-end rounded-[20px] bg-[linear-gradient(145deg,#111827_0%,#ef4444_80%)] p-5">
                <div className="w-full rounded-[18px] bg-white p-4">
                  <div className="h-28 rounded-2xl" style={{ backgroundColor: product.checkoutColor }} />
                  <p className="mt-4 text-lg font-semibold text-zinc-950">{product.name}</p>
                  <p className="mt-1 text-sm text-zinc-500">{product.brand}</p>
                </div>
              </div>
            </div>
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge label={product.status === "published" ? "Publicado" : product.status === "paused" ? "Pausado" : "Rascunho"} tone={statusTone as "success" | "warning" | "red"} />
                <StatusBadge label={product.visibleInShopping ? "No shopping" : "Privado"} tone={product.visibleInShopping ? "neutral" : "warning"} />
                <StatusBadge label={product.approvalMode === "manual" ? "Aprovação manual" : "Aprovação automática"} tone="neutral" />
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <MiniStat label="Preço" value={`R$ ${product.price.toFixed(2)}`} />
                <MiniStat label="Comissão" tone="red" value={commissionLabel} />
                <MiniStat label="Garantia" value={`${product.guaranteeDays} dias`} />
                <MiniStat label="Tipo de produto" value={product.category} />
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <MiniStat label="Base da comissão" value={product.commissionBase} />
                <MiniStat label="Liberação" value={`${product.releaseDays} dias`} />
                <MiniStat label="Atribuição" value={product.attributionModel} />
                <MiniStat label="Janela de atribuição" value={`${product.attributionWindowDays} dias`} />
              </div>
              <div className="rounded-[22px] border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex flex-wrap gap-2">
                  {tabs.map((tab) => (
                    <button
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === activeTab ? "bg-zinc-900 text-white" : "bg-white text-zinc-500 ring-1 ring-zinc-200 hover:text-zinc-900"}`}
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      type="button"
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              {activeTab === "Visão geral" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-200 p-4">
                    <p className="text-sm font-medium text-zinc-500">Descrição</p>
                    <p className="mt-3 text-sm leading-6 text-zinc-700">{product.description || "Sem descrição informada."}</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 p-4">
                    <p className="text-sm font-medium text-zinc-500">Público ideal</p>
                    <p className="mt-3 text-sm leading-6 text-zinc-700">{product.audience || "Sem segmentação informada."}</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 p-4 md:col-span-2">
                    <p className="text-sm font-medium text-zinc-500">Modelo de venda</p>
                    <p className="mt-3 text-sm leading-6 text-zinc-700">
                      Este produto é cadastrado pela empresa. Os links de venda são gerados individualmente para cada influenciador afiliado aprovado.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 p-4">
                    <p className="text-sm font-medium text-zinc-500">Elegibilidade mínima</p>
                    <p className="mt-3 text-sm leading-6 text-zinc-700">
                      Score mínimo {product.minimumCreatorScore}, a partir de {product.minimumFollowers.toLocaleString("pt-BR")} seguidores e regiões: {product.allowedRegions}.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 p-4">
                    <p className="text-sm font-medium text-zinc-500">Regras operacionais</p>
                    <p className="mt-3 text-sm leading-6 text-zinc-700">
                      {product.couponEnabled ? "Cupom habilitado." : "Cupom desabilitado."} {product.whitelistOnly ? "Afiliação restrita a whitelist." : "Afiliação aberta para creators elegíveis."}
                    </p>
                  </div>
                </div>
              ) : null}
              {activeTab === "Criativos" ? (
                <div className="rounded-2xl border border-zinc-200 p-4">
                  <p className="text-sm font-medium text-zinc-500">Materiais de divulgação</p>
                  <p className="mt-3 text-sm leading-6 text-zinc-700">{product.materialsSummary || "Sem materiais informados."}</p>
                </div>
              ) : null}
              {activeTab === "Checkout" ? (
                <div className="space-y-4">
                  {checkoutFeedback ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{checkoutFeedback}</div>
                  ) : null}
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-zinc-700">Cor principal</span>
                      <input
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
                        onChange={(event) => setCheckoutDraft((current) => ({ ...current, checkoutColor: event.target.value }))}
                        value={checkoutDraft.checkoutColor}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-zinc-700">Texto do CTA</span>
                      <input
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
                        onChange={(event) => setCheckoutDraft((current) => ({ ...current, checkoutCtaLabel: event.target.value }))}
                        value={checkoutDraft.checkoutCtaLabel}
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm font-medium text-zinc-700">Headline</span>
                      <input
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
                        onChange={(event) => setCheckoutDraft((current) => ({ ...current, checkoutHeadline: event.target.value }))}
                        value={checkoutDraft.checkoutHeadline}
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm font-medium text-zinc-700">Subheadline</span>
                      <textarea
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
                        onChange={(event) => setCheckoutDraft((current) => ({ ...current, checkoutSubheadline: event.target.value }))}
                        rows={3}
                        value={checkoutDraft.checkoutSubheadline}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-zinc-700">Texto de garantia</span>
                      <input
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
                        onChange={(event) => setCheckoutDraft((current) => ({ ...current, checkoutGuaranteeText: event.target.value }))}
                        value={checkoutDraft.checkoutGuaranteeText}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-zinc-700">Texto de suporte</span>
                      <input
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
                        onChange={(event) => setCheckoutDraft((current) => ({ ...current, checkoutSupportText: event.target.value }))}
                        value={checkoutDraft.checkoutSupportText}
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm font-medium text-zinc-700">Highlights</span>
                      <textarea
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
                        onChange={(event) => setCheckoutDraft((current) => ({ ...current, checkoutHighlights: event.target.value }))}
                        rows={4}
                        value={checkoutDraft.checkoutHighlights}
                      />
                    </label>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-sm font-medium text-zinc-500">Preview do checkout</p>
                    <div className="mt-4 overflow-hidden rounded-[20px] border border-zinc-200 bg-white">
                      <div className="p-5" style={{ backgroundColor: `${checkoutDraft.checkoutColor}12` }}>
                        <div className="h-2 w-24 rounded-full" style={{ backgroundColor: checkoutDraft.checkoutColor }} />
                        <h4 className="mt-4 text-2xl font-semibold text-zinc-950">
                          {checkoutDraft.checkoutHeadline || "Headline principal do checkout"}
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-zinc-600">
                          {checkoutDraft.checkoutSubheadline || "Subheadline do checkout para contexto e conversão."}
                        </p>
                      </div>
                      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_280px]">
                        <ul className="space-y-3 text-sm text-zinc-700">
                          {(checkoutDraft.checkoutHighlights || "Benefício 1\nBenefício 2\nBenefício 3")
                            .split("\n")
                            .filter(Boolean)
                            .map((item) => (
                              <li className="flex items-start gap-3" key={item}>
                                <span className="mt-1 h-2 w-2 rounded-full" style={{ backgroundColor: checkoutDraft.checkoutColor }} />
                                <span>{item}</span>
                              </li>
                            ))}
                        </ul>
                        <div className="rounded-2xl border border-zinc-200 p-4">
                          <p className="text-sm text-zinc-500">Valor</p>
                          <p className="mt-2 text-3xl font-semibold text-zinc-950">R$ {product.price.toFixed(2)}</p>
                          <button
                            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold text-white"
                            style={{ backgroundColor: checkoutDraft.checkoutColor }}
                            type="button"
                          >
                            {checkoutDraft.checkoutCtaLabel || "Comprar agora"}
                          </button>
                          <p className="mt-3 text-sm leading-6 text-zinc-600">
                            {checkoutDraft.checkoutGuaranteeText || "Texto de garantia"}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-zinc-500">
                            {checkoutDraft.checkoutSupportText || "Texto de suporte"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-[0_18px_40px_-25px_rgba(220,38,38,0.95)]"
                      onClick={saveCheckout}
                      type="button"
                    >
                      Salvar checkout
                    </button>
                  </div>
                </div>
              ) : null}
              {activeTab === "Configurações" ? (
                <div className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-700">
                  <p>Aprovação: {product.approvalMode === "manual" ? "Manual" : "Automática"}</p>
                  <p className="mt-2">Shopping: {product.visibleInShopping ? "Visível" : "Privado"}</p>
                  <p className="mt-2">Payout: {product.payoutMode === "platform_split" ? "Split na plataforma" : "Ledger da plataforma"}</p>
                  <p className="mt-2">Logística: {product.logisticsMode}</p>
                  <p className="mt-2">Frete: {product.shippingManagedBy}</p>
                  <p className="mt-2">Agenda obrigatória: {product.bookingRequired ? "Sim" : "Não"}</p>
                  <p className="mt-2">Suporte: {product.supportEmail}</p>
                  <p>Criado em: {new Date(product.createdAt).toLocaleDateString("pt-BR")}</p>
                  <p className="mt-2">Atualizado em: {new Date(product.updatedAt).toLocaleDateString("pt-BR")}</p>
                </div>
              ) : null}
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <SectionCard subtitle="Cada afiliado aprovado recebe o próprio link e gera resultados independentes neste produto." title="Afiliados ativos">
            <DataTable
              columns={["Afiliado", "Link próprio", "Cliques", "Vendas", "Comissão", "Status"]}
              rows={[
                ["Ana Martinelli", "mm.link/ana/mapa360", "1.240", "38", "R$ 5.780", "Publicado"],
                ["Jaine Chagas", "mm.link/jaine/mapa360", "980", "24", "R$ 3.650", "Publicado"],
                ["Yuri Aguiar", "mm.link/yuri/mapa360", "614", "12", "R$ 1.824", "Publicado"]
              ]}
            />
          </SectionCard>

          <SectionCard subtitle="Apenas as duas ações principais do produto." title="Ações">
            <div className="space-y-3">
              <Link className="block rounded-2xl border border-zinc-200 px-4 py-4 text-sm font-semibold text-zinc-700" href={`/mundo-mapping/afiliados/produtos/${product.slug}/editar`}>
                Editar dados do produto
              </Link>
              <button
                className="block w-full rounded-2xl border border-zinc-200 px-4 py-4 text-left text-sm font-semibold text-zinc-700"
                onClick={() => {
                  setProductStatus(product.slug, product.status === "published" ? "paused" : "published");
                  router.refresh();
                }}
                type="button"
              >
                {product.status === "published" ? "Pausar produto" : "Publicar produto"}
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
