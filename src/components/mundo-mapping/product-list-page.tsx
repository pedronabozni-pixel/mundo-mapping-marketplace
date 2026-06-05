"use client";

import Link from "next/link";
import { PageHeader, ProductVisualCard, SectionCard } from "@/components/mundo-mapping/affiliate-ui";
import { useProductStore } from "@/components/mundo-mapping/product-store";
import { usePlanLimits } from "@/components/mundo-mapping/use-plan-limits";

export function ProductListPage() {
  const { products, ready } = useProductStore();
  const { atLimit, planLabel } = usePlanLimits();

  return (
    <>
      <PageHeader
        actions={
          atLimit ? (
            <div className="flex flex-col items-end gap-1">
              <span className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-xl px-4 text-sm font-semibold" style={{ background: "rgba(255,255,255,0.04)", color: "#555" }}>
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
          )
        }
        description="Todos os produtos cadastrados pela sua conta. Clique em um produto para acessar o hub completo."
        eyebrow="Mundo Mapping / Afiliados / Produtos"
        title="Meus produtos"
      />

      <div className="p-6">
        <SectionCard subtitle="Catálogo completo da sua conta com links diretos para cada hub de produto." title="Produtos cadastrados">
          {!ready ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-48 animate-pulse rounded-[22px]" style={{ background: "rgba(255,255,255,0.04)" }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl px-6 py-12 text-center" style={{ background: "rgba(255,255,255,0.015)", border: "1px dashed rgba(255,255,255,0.06)" }}>
              <p className="text-sm font-medium" style={{ color: "#aaa" }}>Nenhum produto criado ainda.</p>
              <p className="mt-2 text-sm" style={{ color: "#666" }}>Use o botão "Criar produto" para cadastrar seu primeiro produto.</p>
              <Link
                className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-[0_8px_24px_-10px_rgba(220,38,38,0.7)] transition hover:bg-red-700"
                href="/mundo-mapping/afiliados/produtos/novo"
              >
                Criar produto
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
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
          )}
        </SectionCard>
      </div>
    </>
  );
}
