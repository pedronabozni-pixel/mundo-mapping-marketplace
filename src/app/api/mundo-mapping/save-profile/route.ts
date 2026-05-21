import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.userId || !body?.profile) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  // Verify the user actually exists in auth.users before saving
  const admin = createAdminClient();
  const { data: { user }, error: authError } = await admin.auth.admin.getUserById(body.userId);
  if (authError || !user) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const { error } = await admin
    .from("profiles")
    .upsert({ id: body.userId, ...body.profile }, { onConflict: "id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
