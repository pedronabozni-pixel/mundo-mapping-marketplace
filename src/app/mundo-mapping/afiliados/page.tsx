import { ProductDashboard } from "@/components/mundo-mapping/product-dashboard";
import { EmpresaPlanBanner } from "@/components/mundo-mapping/empresa-plan-banner";

export const metadata = {
  title: "Mundo Mapping | Modulo de Afiliados"
};

export default function MundoMappingAffiliadosPage() {
  return (
    <>
      <EmpresaPlanBanner />
      <ProductDashboard />
    </>
  );
}
