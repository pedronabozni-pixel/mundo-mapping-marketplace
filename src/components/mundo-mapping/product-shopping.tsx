"use client";

import Link from "next/link";
import { PageHeader, ProductVisualCard, SectionCard } from "@/components/mundo-mapping/affiliate-ui";
import { useProductStore } from "@/components/mundo-mapping/product-store";

export function ProductShopping() {
  const { products } = useProductStore();
  const visibleProducts = products.filter((product) => product.visibleInShopping && product.status === "published");

  return (
    <>
      <PageHeader
        actions={
          <Link className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-[0_18px_40px_-25px_rgba(220,38,38,0.95)]" href="/mundo-mapping/afiliados/produtos/novo">
            Criar produto
          </Link>
        }
        description="Shopping mais limpo e direto, conectado aos produtos publicados e visíveis no módulo."
        eyebrow="Mundo Mapping / Afiliados / Shopping afiliados"
        title="Shopping de produtos"
      />

      <div className="space-y-6 p-6">
        <SectionCard subtitle="Catálogo direto, sem excesso de destaque visual." title="Produtos publicados">
          {visibleProducts.length ? (
            <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((product) => (
                <Link href={`/mundo-mapping/afiliados/produtos/${product.slug}`} key={product.id}>
                  <ProductVisualCard
                    commission={product.commissionType === "percent" ? `${product.commissionValue}% por venda` : `R$ ${product.commissionValue.toFixed(2)} por venda`}
                    price={`R$ ${product.price.toFixed(2)}`}
                    status="Público"
                    title={product.name}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-500">
              Nenhum produto publicado no shopping ainda.
            </div>
          )}
        </SectionCard>
      </div>
    </>
  );
}
