"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProductDetail } from "@/components/mundo-mapping/product-detail";
import { PageHeader, SectionCard } from "@/components/mundo-mapping/affiliate-ui";
import { fromRow, ProductRecord } from "@/components/mundo-mapping/product-store";

type State = "loading" | "found" | "not-found";

export function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [state, setState] = useState<State>("loading");
  const [product, setProduct] = useState<ProductRecord | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/mundo-mapping/empresa/login";
        return;
      }

      const { data } = await supabase
        .from("produtos")
        .select("*")
        .eq("slug", slug)
        .eq("empresa_id", user.id)
        .single();

      if (cancelled) return;
      if (data) {
        setProduct(fromRow(data));
        setState("found");
      } else {
        setState("not-found");
      }
    }
    load();
    return () => { cancelled = true; };
  }, [slug]);

  if (state === "loading") {
    return (
      <div className="space-y-4 p-6">
        <div className="h-16 animate-pulse rounded-2xl bg-zinc-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-zinc-100" />
      </div>
    );
  }

  if (state === "not-found" || !product) {
    return (
      <>
        <PageHeader
          description="Esse produto não foi encontrado ou não pertence à sua conta."
          eyebrow="Mundo Mapping / Afiliados / Produtos"
          title="Produto não encontrado"
        />
        <div className="p-6">
          <SectionCard subtitle="Volte ao dashboard ou crie um novo produto." title="Nada por aqui">
            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                href="/mundo-mapping/afiliados"
              >
                Voltar ao dashboard
              </Link>
              <Link
                className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                href="/mundo-mapping/afiliados/produtos/novo"
              >
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
