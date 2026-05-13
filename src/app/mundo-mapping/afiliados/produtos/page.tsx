import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductListPage } from "@/components/mundo-mapping/product-list-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mundo Mapping | Meus produtos",
};

export default async function ProdutosIndexPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/mundo-mapping/empresa/login");

  return <ProductListPage />;
}
