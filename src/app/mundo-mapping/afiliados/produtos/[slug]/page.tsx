import { ProductDetailPage } from "@/components/mundo-mapping/product-detail-page";

export default function ProdutoSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  return <ProductDetailPage params={params} />;
}
