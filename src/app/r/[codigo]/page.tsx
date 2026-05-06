import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AffiliateRedirectPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;

  const supabase = await createClient();

  const { data: urlProduto } = await supabase.rpc("registrar_clique", {
    p_codigo: codigo,
  });

  if (!urlProduto) {
    redirect("/mundo-mapping/influenciadores/shopping");
  }

  redirect(urlProduto as string);
}
