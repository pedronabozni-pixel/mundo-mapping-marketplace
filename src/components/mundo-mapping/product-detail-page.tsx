"use client";

import Link from "next/link";
import { use } from "react";
import { ProductDetail } from "@/components/mundo-mapping/product-detail";
import { PageHeader, SectionCard } from "@/components/mundo-mapping/affiliate-ui";
import { useProductStore } from "@/components/mundo-mapping/product-store";

export function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { getProductBySlug, ready } = useProductStore();
  const product = getProductBySlug(slug);

  if (!ready) {
    return <div className="p-6 text-sm text-zinc-500">Carregando produto...</div>;
  }

  if (!product) {
    return (
      <>
        <PageHeader
          description="Não encontramos esse produto na base local do módulo."
          eyebrow="Mundo Mapping / Afiliados / Produtos"
          title="Produto não encontrado"
        />
        <div className="p-6">
          <SectionCard subtitle="Crie um novo produto ou volte ao dashboard." title="Nada por aqui">
            <div className="flex gap-3">
              <Link className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700" href="/mundo-mapping/afiliados">
                Voltar ao dashboard
              </Link>
              <Link className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white" href="/mundo-mapping/afiliados/produtos/novo">
                Criar produto
              </Link>
            </div>
          </SectionCard>
        </div>
      </>
    );
  }

  return <ProductDetail product={product} />;
}
