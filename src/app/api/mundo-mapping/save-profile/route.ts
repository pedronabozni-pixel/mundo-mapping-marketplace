import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.userId || !body?.profile) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: { user }, error: authError } = await admin.auth.admin.getUserById(body.userId);
  if (authError || !user) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  // Only allow saving profile for users created in the last hour (signup flow only)
  const createdAt = new Date(user.created_at).getTime();
  if (Date.now() - createdAt > 60 * 60 * 1000) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { error } = await admin
    .from("profiles")
    .upsert({ id: body.userId, ...body.profile }, { onConflict: "id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
