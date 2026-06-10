import { createClient } from "@/lib/supabase/server";
import CheckoutClient from "./checkout-client";

export const dynamic = "force-dynamic";

export type Produto = {
  id: string;
  slug: string;
  nome: string;
  empresa_id: string;
  empresa_nome: string | null;
  preco: number;
  tipo_entregavel: string | null;
  checkout_headline: string | null;
  checkout_subheadline: string | null;
  checkout_cta: string | null;
  checkout_garantia: string | null;
  checkout_cor: string | null;
  checkout_cor_fundo: string | null;
  checkout_highlights: string | null;
  checkout_depoimentos: Array<{ name: string; role?: string; text: string; photo?: string }> | null;
  checkout_mensagem_obrigado: string | null;
  capa_url: string | null;
  comissao_tipo: string;
  comissao_valor: number;
  order_bump_ativo: boolean | null;
  order_bump_produto_id: string | null;
  order_bump_preco: number | null;
  order_bump_texto: string | null;
  order_bump_descricao: string | null;
  upsell_ativo: boolean | null;
  upsell_produto_id: string | null;
  upsell_preco: number | null;
  upsell_headline: string | null;
  upsell_timer_minutos: number | null;
};

export type ProdutoSimples = {
  id: string;
  slug: string;
  nome: string;
  preco: number;
  capa_url: string | null;
};

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const ref = (resolvedSearchParams.ref as string) ?? "";

  const supabase = await createClient();

  const { data: produto } = await supabase
    .from("produtos")
    .select(
      `id, slug, nome, empresa_id, empresa_nome, preco, tipo_entregavel,
       checkout_headline, checkout_subheadline, checkout_cta, checkout_garantia,
       checkout_cor, checkout_cor_fundo, checkout_highlights, checkout_depoimentos,
       checkout_mensagem_obrigado, capa_url, comissao_tipo, comissao_valor,
       order_bump_ativo, order_bump_produto_id, order_bump_preco, order_bump_texto, order_bump_descricao,
       upsell_ativo, upsell_produto_id, upsell_preco, upsell_headline, upsell_timer_minutos`
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!produto) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="text-center">
          <h1 className="text-xl font-extrabold text-white">Produto não encontrado</h1>
          <p className="mt-2 text-sm text-[#888]">
            O produto que você está procurando não existe ou não está disponível.
          </p>
        </div>
      </div>
    );
  }

  // Busca produto do order bump (se ativo)
  let orderBumpProduto: ProdutoSimples | null = null;
  if (produto.order_bump_ativo && produto.order_bump_produto_id) {
    const { data } = await supabase
      .from("produtos")
      .select("id, slug, nome, preco, capa_url")
      .eq("id", produto.order_bump_produto_id)
      .eq("status", "published")
      .maybeSingle();
    orderBumpProduto = data ?? null;
  }

  return (
    <div style={{ backgroundColor: "#0a0a0a", minHeight: "100vh" }}>
      <CheckoutClient
        affiliateRef={ref}
        orderBumpProduto={orderBumpProduto}
        produto={{
          ...produto,
          comissao_tipo: produto.comissao_tipo ?? "percent",
          comissao_valor: Number(produto.comissao_valor) || 0,
        }}
      />
    </div>
  );
}
