import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AffiliateFrame } from "@/components/mundo-mapping/affiliate-frame";

export default async function MundoMappingAffiliadosLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/mundo-mapping/empresa/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();

  const userType = profile?.user_type;

  // null user_type = novo cadastro (trigger padrão = empresa). admin também pode acessar.
  if (userType && userType !== "empresa" && userType !== "admin") {
    redirect("/mundo-mapping/influenciador/login");
  }

  return <AffiliateFrame>{children}</AffiliateFrame>;
}
