import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AffiliateRedirectPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;

  console.log("[/r] codigo recebido:", codigo);

  const supabase = await createClient();

  const { data: urlProduto, error } = await supabase.rpc("registrar_clique", {
    p_codigo: codigo,
  });

  console.log("[/r] resultado RPC registrar_clique:", { data: urlProduto, error });

  if (!error && urlProduto) {
    console.log("[/r] redirecionando para:", urlProduto);
    redirect(urlProduto as string);
  }

  console.log("[/r] fallback → /mundo-mapping/partners");
  redirect("/mundo-mapping/partners");
}
