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
    .select("wallet_id, user_type")
    .eq("id", user.id)
    .single();

  if (!profile || profile.user_type !== "empresa") {
    return NextResponse.json({ error: "not_empresa" }, { status: 403 });
  }

  if (!profile.wallet_id) {
    return NextResponse.json(
      { error: "Complete seus dados para publicar produtos" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
