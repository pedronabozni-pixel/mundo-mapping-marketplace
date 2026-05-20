import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const adminSession = await getAdminSession();
  if (!adminSession) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const admin = createAdminClient(adminSession.accessToken);
  const { data, error } = await admin
    .from("profiles")
    .select("id, full_name, email, instagram_handle, instagram_followers, niche, status, status_aprovacao, created_at")
    .eq("user_type", "influenciador")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
