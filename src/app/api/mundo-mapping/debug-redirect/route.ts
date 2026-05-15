/**
 * Diagnostic endpoint — call as:
 *   /api/mundo-mapping/debug-redirect?codigo=6us4Ek2V
 *
 * Returns JSON showing exactly what the Supabase anon client sees.
 * DELETE this file after debugging.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const codigo = req.nextUrl.searchParams.get("codigo") ?? "";

  const supabase = await createClient();

  // 1. Raw SELECT — ignores ativo filter to catch "exists but inactive" case
  const { data: rawRow, error: rawError } = await supabase
    .from("links_afiliados")
    .select("id, codigo, url_produto, ativo, cliques")
    .eq("codigo", codigo)
    .maybeSingle();

  // 2. Filtered SELECT — same as the redirect route uses
  const { data: filteredRow, error: filteredError } = await supabase
    .from("links_afiliados")
    .select("url_produto")
    .eq("codigo", codigo)
    .eq("ativo", true)
    .maybeSingle();

  // 3. RPC call
  const { data: rpcResult, error: rpcError } = await supabase.rpc("registrar_clique", {
    p_codigo: codigo,
  });

  return NextResponse.json({
    codigo,
    raw_select: { data: rawRow, error: rawError },
    filtered_select: { data: filteredRow, error: filteredError },
    rpc_registrar_clique: { data: rpcResult, error: rpcError },
    diagnosis: {
      table_visible_to_anon: rawRow !== null || rawError !== null,
      row_found_unfiltered: rawRow !== null,
      row_found_filtered: filteredRow !== null,
      rpc_callable: rpcError === null,
      rpc_returned_url: rpcResult,
      will_redirect_to: rpcResult || filteredRow?.url_produto || "FALLBACK /mundo-mapping/partners",
    },
  });
}
