import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { access_token, user_id } = await req.json();

  if (!access_token || !user_id) {
    return NextResponse.json({ isAdmin: false, error: "missing_params" }, { status: 400 });
  }

  const supabase = createAdminClient(access_token);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("user_type, email")
    .eq("id", user_id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ isAdmin: false, error: error?.message ?? "profile_not_found" });
  }

  return NextResponse.json({ isAdmin: profile.user_type === "admin", userType: profile.user_type });
}
