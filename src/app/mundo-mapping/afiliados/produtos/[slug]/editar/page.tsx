import { ProductEditPage } from "@/components/mundo-mapping/product-edit-page";

export default function ProdutoEditarPage({ params }: { params: Promise<{ slug: string }> }) {
  return <ProductEditPage params={params} />;
}
