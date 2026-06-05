"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { fromRow, ProductRecord } from "@/components/mundo-mapping/product-store";
import { MiniStat, SectionCard, StatusBadge } from "@/components/mundo-mapping/affiliate-ui";

type RequestStatus = "idle" | "requested" | "approved";
type MarketplaceFilter = "Todos" | "Em alta" | "Mais lucrativos" | "Novidades";

const marketplaceFilters: MarketplaceFilter[] = ["Todos", "Em alta", "Mais lucrativos", "Novidades"];

export function InfluencerMarketplace() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [requests, setRequests] = useState<Record<string, RequestStatus>>({});
  const [activeFilter, setActiveFilter] = useState<MarketplaceFilter>("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("produtos")
        .select("*")
        .eq("status", "published")
        .eq("visivel_shopping", true)
        .order("criado_em", { ascending: false });
      setProducts((data ?? []).map(fromRow));
      setReady(true);
    }
    load();
  }, []);

  const visibleProducts = useMemo(() => {
    const baseProducts = products.filter((product) => product.visibleInShopping && product.status === "published");
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const searchedProducts = normalizedSearch
      ? baseProducts.filter((product) => product.name.toLowerCase().includes(normalizedSearch))
      : baseProducts;

    if (activeFilter === "Em alta") {
      return searchedProducts.filter((product) => product.approvalMode === "automatic");
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
        subtitle="Todos os produtos publicados por empresas e produtores e abertos para afiliação aparecem aqui para o influenciador solicitar entrada."
        title="Marketplace de afiliação"
      >
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {marketplaceFilters.map((filter) => (
              <button
                className="rounded-full px-4 py-2 text-sm font-semibold transition"
                key={filter}
                onClick={() => setActiveFilter(filter)}
                style={
                  activeFilter === filter
                    ? { background: "rgba(255,255,255,0.1)", color: "#fff" }
                    : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#666" }
                }
                type="button"
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="w-full lg:max-w-sm">
            <input
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#555]"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar produto pelo nome"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={(e) => (e.target.style.borderColor = "#C8102E")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
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
              <article
                className="overflow-hidden rounded-[22px]"
                key={product.id}
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div
                  className="p-5"
                  style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold tracking-tight text-white">{product.name}</h3>
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
                  <p className="mt-3 text-sm leading-6" style={{ color: "#888" }}>
                    {product.description || "Produto publicado no marketplace de afiliados."}
                  </p>
                </div>

                <div className="space-y-4 p-5">
                  <div className="grid grid-cols-2 gap-3">
                    <MiniStat label="Preço" value={`R$ ${product.price.toFixed(2)}`} />
                    <MiniStat label="Comissão" tone="red" value={commissionLabel} />
                    <MiniStat label="Garantia" value={`${product.guaranteeDays} dias`} />
                    <MiniStat label="Tipo" value={product.category} />
                    <MiniStat label="Seguidores mínimos" value={product.minimumFollowers.toLocaleString("pt-BR")} />
                  </div>

                  <div
                    className="rounded-2xl p-4 text-sm leading-6"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", color: "#888" }}
                  >
                    <p>
                      {product.approvalMode === "automatic"
                        ? "Ao solicitar afiliação, a entrada pode ser aprovada automaticamente e o seu link é gerado na hora."
                        : "Ao solicitar afiliação, a empresa ou produtor revisa o perfil antes de liberar o seu link de venda."}
                    </p>
                    <p className="mt-2">Regiões elegíveis: {product.allowedRegions}.</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      className={
                        requestStatus === "idle"
                          ? "inline-flex h-11 items-center justify-center rounded-xl bg-[#C8102E] px-4 text-sm font-semibold text-white shadow-[0_18px_40px_-25px_rgba(200,16,46,0.95)] transition hover:bg-[#A30D24]"
                          : "inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold"
                      }
                      disabled={requestStatus !== "idle"}
                      onClick={() => requestAffiliation(product.slug, product.approvalMode)}
                      style={requestStatus !== "idle" ? { background: "rgba(255,255,255,0.04)", color: "#555" } : {}}
                      type="button"
                    >
                      {requestStatus === "approved"
                        ? "Link liberado"
                        : requestStatus === "requested"
                          ? "Solicitação enviada"
                          : "Solicitar afiliação"}
                    </button>
                    <Link
                      className="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition"
                      href="/mundo-mapping/influenciadores/meus-links"
                      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      Ver meus links
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {ready && !visibleProducts.length ? (
          <div
            className="mt-5 rounded-2xl px-6 py-10 text-center text-sm"
            style={{ border: "1px dashed rgba(255,255,255,0.06)", color: "#555" }}
          >
            Nenhum produto encontrado para este filtro ou busca.
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}
