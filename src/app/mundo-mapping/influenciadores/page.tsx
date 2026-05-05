import { InfluencerHome } from "@/components/mundo-mapping/influencer-home";
import { InfluenciadorPlanBanner } from "@/components/mundo-mapping/influenciador-plan-banner";

export const metadata = {
  title: "Mundo Mapping | Portal do Influenciador"
};

export default function MundoMappingInfluenciadoresPage() {
  return (
    <>
      <InfluenciadorPlanBanner />
      <InfluencerHome />
    </>
  );
}
