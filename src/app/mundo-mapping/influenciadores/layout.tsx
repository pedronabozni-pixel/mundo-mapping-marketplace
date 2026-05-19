import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InfluencerFrame } from "@/components/mundo-mapping/influencer-frame";

export default async function MundoMappingInfluenciadoresLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/mundo-mapping/influenciador/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();

  const userType = profile?.user_type;

  // Apenas influenciadores e admin podem acessar esta seção
  if (!userType || (userType !== "influenciador" && userType !== "admin")) {
    redirect("/mundo-mapping/empresa/login");
  }

  return <InfluencerFrame>{children}</InfluencerFrame>;
}
