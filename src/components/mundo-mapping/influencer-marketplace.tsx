"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MiniStat, SectionCard, StatusBadge } from "@/components/mundo-mapping/affiliate-ui";
import { useProductStore } from "@/components/mundo-mapping/product-store";

type RequestStatus = "idle" | "requested" | "approved";
type MarketplaceFilter = "Todos" | "Em alta" | "Mais lucrativos" | "Novidades";

const STORAGE_KEY = "mundo-mapping-influencer-affiliation-requests";
const marketplaceFilters: MarketplaceFilter[] = ["Todos", "Em alta", "Mais lucrativos", "Novidades"];

export function InfluencerMarketplace() {
  const { products, ready } = useProductStore();
  const [requests, setRequests] = useState<Record<string, RequestStatus>>({});
  const [activeFilter, setActiveFilter] = useState<MarketplaceFilter>("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setRequests(JSON.parse(raw) as Record<string, RequestStatus>);
      }
    } catch {
      setRequests({});
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  }, [requests]);

  const visibleProducts = useMemo(() => {
    const baseProducts = products.filter((product) => product.visibleInShopping && product.status === "published");
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const searchedProducts = normalizedSearch
      ? baseProducts.filter((product) => product.name.toLowerCase().includes(normalizedSearch) || product.brand.toLowerCase().includes(normalizedSearch))
      : baseProducts;

    if (activeFilter === "Em alta") {
      return searchedProducts.filter((product) => product.minimumCreatorScore >= 75 || product.approvalMode === "automatic");
    }

    if (activeFilter === "Mais lucrativos") {
      return [...searchedProducts].sort((a, b) => {
        const aCommission = a.commissionType === "percent" ? (a.price * a.commissionValue) / 100 : a.commissionValue;
        const bCommission = b.commissionType === "percent" ? (b.price * b.commissionValue) / 100 : b.commissionValue;
        return bCommission - aCommission;
      });
    }

    if (activeFilter === "Novidades") {
      return [...searchedProducts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return searchedProducts;
  }, [activeFilter, products, searchTerm]);

  function requestAffiliation(slug: string, approvalMode: "automatic" | "manual") {
    setRequests((current) => ({
      ...current,
      [slug]: approvalMode === "automatic" ? "approved" : "requested"
    }));
  }

  return (
    <div className="space-y-6 p-6">
      <SectionCard
        action={<StatusBadge label={`${visibleProducts.length} produtos disponíveis`} tone="success" />}
        subtitle="Todos os produtos publicados por todas as empresas e abertos para afiliação aparecem aqui para o influenciador solicitar entrada."
        title="Marketplace de afiliação"
      >
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {marketplaceFilters.map((filter) => (
              <button
                className={
                  activeFilter === filter
                    ? "rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
                    : "rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-600 hover:border-zinc-300 hover:bg-white"
                }
                key={filter}
                onClick={() => setActiveFilter(filter)}
                type="button"
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="w-full lg:max-w-sm">
            <input
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar produto pelo nome"
              type="text"
              value={searchTerm}
            />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {visibleProducts.map((product) => {
            const requestStatus = requests[product.slug] ?? "idle";
            const commissionLabel =
              product.commissionType === "percent"
                ? `${product.commissionValue}% por venda`
                : `R$ ${product.commissionValue.toFixed(2)} por venda`;

            return (
              <article className="overflow-hidden rounded-[22px] border border-zinc-200 bg-white shadow-[0_18px_50px_-44px_rgba(24,24,27,0.24)]" key={product.id}>
                <div className="border-b border-zinc-100 bg-[linear-gradient(135deg,#fafafa_0%,#f4f4f5_100%)] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">{product.brand}</p>
                      <h3 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">{product.name}</h3>
                    </div>
                    <StatusBadge
                      label={
                        requestStatus === "approved"
                          ? "Afiliado"
                          : requestStatus === "requested"
                            ? "Solicitado"
                            : product.approvalMode === "automatic"
                              ? "Entrada automática"
                              : "Aprovação manual"
                      }
                      tone={requestStatus === "approved" ? "success" : requestStatus === "requested" ? "warning" : "neutral"}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-600">{product.description || "Produto publicado no marketplace de afiliados."}</p>
                </div>

                <div className="space-y-4 p-5">
                  <div className="grid grid-cols-2 gap-3">
                    <MiniStat label="Preço" value={`R$ ${product.price.toFixed(2)}`} />
                    <MiniStat label="Comissão" tone="red" value={commissionLabel} />
                    <MiniStat label="Garantia" value={`${product.guaranteeDays} dias`} />
                    <MiniStat label="Tipo" value={product.category} />
                    <MiniStat label="Score mínimo" value={`${product.minimumCreatorScore}/100`} />
                    <MiniStat label="Seguidores mínimos" value={product.minimumFollowers.toLocaleString("pt-BR")} />
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
                    <p>
                      {product.approvalMode === "automatic"
                        ? "Ao solicitar afiliação, a entrada pode ser aprovada automaticamente e o seu link é gerado na hora."
                        : "Ao solicitar afiliação, a empresa revisa o perfil antes de liberar o seu link de venda."}
                    </p>
                    <p className="mt-2">Regiões elegíveis: {product.allowedRegions}. {product.requireSocialProof ? "Exige creator com histórico validado." : "Aberto para creators elegíveis da base validada."}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      className={
                        requestStatus === "idle"
                          ? "inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-[0_18px_40px_-25px_rgba(220,38,38,0.95)]"
                          : "inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-500"
                      }
                      disabled={requestStatus !== "idle"}
                      onClick={() => requestAffiliation(product.slug, product.approvalMode)}
                      type="button"
                    >
                      {requestStatus === "approved"
                        ? "Link liberado"
                        : requestStatus === "requested"
                          ? "Solicitação enviada"
                          : "Solicitar afiliação"}
                    </button>
                    <Link className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700" href="/mundo-mapping/influenciadores/links">
                      Ver meus links
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {ready && !visibleProducts.length ? (
          <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-500">
            Nenhum produto encontrado para este filtro ou busca.
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}
