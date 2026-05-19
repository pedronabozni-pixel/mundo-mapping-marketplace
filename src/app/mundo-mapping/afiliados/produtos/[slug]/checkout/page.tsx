import { CheckoutEditorPage } from "@/components/mundo-mapping/checkout-editor-page";

export default function ProdutoCheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  return <CheckoutEditorPage params={params} />;
}
