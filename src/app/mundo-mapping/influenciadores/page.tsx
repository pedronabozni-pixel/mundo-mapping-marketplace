import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InfluencerHome } from "@/components/mundo-mapping/influencer-home";
import { InfluenciadorPlanBanner } from "@/components/mundo-mapping/influenciador-plan-banner";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mundo Mapping | Portal do Influenciador"
};

export default async function MundoMappingInfluenciadoresPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/mundo-mapping/influenciador/login");

  return (
    <>
      <InfluenciadorPlanBanner />
      <InfluencerHome />
    </>
  );
}
