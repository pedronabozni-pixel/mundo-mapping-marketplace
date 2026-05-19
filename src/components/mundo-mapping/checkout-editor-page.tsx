"use client";

import Link from "next/link";
import { use } from "react";
import { PageHeader, SectionCard } from "@/components/mundo-mapping/affiliate-ui";
import { CheckoutEditor } from "@/components/mundo-mapping/checkout-editor";
import { useProductStore } from "@/components/mundo-mapping/product-store";

export function CheckoutEditorPage({ params }: { params: Promise<{ slug: string }> }) {
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
          description="Não encontramos esse produto."
          eyebrow="Mundo Mapping / Afiliados / Produtos"
          title="Produto não encontrado"
        />
        <div className="p-6">
          <SectionCard subtitle="Volte ao dashboard." title="Nada por aqui">
            <div className="flex gap-3">
              <Link className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700" href="/mundo-mapping/afiliados">
                Voltar ao dashboard
              </Link>
            </div>
          </SectionCard>
        </div>
      </>
    );
  }

  return <CheckoutEditor product={product} />;
}
