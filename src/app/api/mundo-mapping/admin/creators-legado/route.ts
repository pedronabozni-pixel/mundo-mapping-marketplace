import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

// Visão do admin sobre a base legado. O admin é o dono da base e PODE ver o
// e-mail; ainda assim, celular e ids do Asaas NÃO saem por esta rota.
const FIELDS =
  "id, nome, email, rede_principal, instagram_seguidores, tiktok_seguidores, youtube_inscritos, ativado, ativado_em";

export async function GET(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const params = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);
  const q = (params.get("q") ?? "").trim();

  let query = createAdminClient()
    .from("creators_legado")
    .select(FIELDS, { count: "exact" });

  if (q) {
    const safe = q.replace(/[%_,]/g, "\\$&");
    query = query.or(`nome.ilike.%${safe}%,email.ilike.%${safe}%`);
  }

  const from = (page - 1) * PER_PAGE;
  const { data, count, error } = await query
    .order("ativado", { ascending: false })
    .order("instagram_seguidores", { ascending: false, nullsFirst: false })
    .range(from, from + PER_PAGE - 1);

  if (error) {
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  return NextResponse.json({
    total: count ?? 0,
    page,
    per_page: PER_PAGE,
    rows: data ?? [],
  });
}
