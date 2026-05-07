import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductDashboard } from "@/components/mundo-mapping/product-dashboard";
import { EmpresaPlanBanner } from "@/components/mundo-mapping/empresa-plan-banner";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mundo Mapping | Modulo de Afiliados"
};

export default async function MundoMappingAffiliadosPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
if (!session) redirect("/mundo-mapping/empresa/login");

  return (
    <>
      <EmpresaPlanBanner />
      <ProductDashboard />
    </>
  );
}
