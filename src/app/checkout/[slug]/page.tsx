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
      "id, slug, nome, empresa_id, empresa_nome, preco, tipo_entregavel, checkout_headline, checkout_subheadline, checkout_cta, checkout_garantia, checkout_cor, checkout_cor_fundo, checkout_highlights, checkout_depoimentos, checkout_mensagem_obrigado, capa_url, comissao_tipo, comissao_valor"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!produto) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#f3f4f6",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#111827" }}>
            Produto não encontrado
          </h1>
          <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>
            O produto que você está procurando não existe ou não está disponível.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: produto.checkout_cor_fundo ?? "#ffffff",
        minHeight: "100vh",
      }}
    >
      <CheckoutClient
        affiliateRef={ref}
        produto={{
          ...produto,
          comissao_tipo: produto.comissao_tipo ?? "percent",
          comissao_valor: Number(produto.comissao_valor) || 0,
        }}
      />
    </div>
  );
}
