import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .single();

  if (!profile || profile.user_type !== "empresa") {
    return NextResponse.json({ error: "not_empresa" }, { status: 403 });
  }

  // Publicação NÃO depende mais de wallet_id do Asaas (a wallet/subconta será
  // retomada depois com POST /accounts). user_type continua sendo exigido.
  return NextResponse.json({ ok: true });
}
