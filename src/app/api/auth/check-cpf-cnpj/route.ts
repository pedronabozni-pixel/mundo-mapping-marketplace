import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const cpf_cnpj = typeof body.cpf_cnpj === "string" ? body.cpf_cnpj.trim() : "";

  if (!cpf_cnpj) {
    return NextResponse.json({ exists: false });
  }

  const admin = createAdminClient();
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("cpf_cnpj", cpf_cnpj);

  return NextResponse.json({ exists: (count ?? 0) > 0 });
}
