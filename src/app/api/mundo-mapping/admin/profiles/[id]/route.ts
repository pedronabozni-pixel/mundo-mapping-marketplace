import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const { updates, action, targetEmail } = await req.json() as {
    updates: Record<string, string>;
    action: string;
    targetEmail?: string;
  };

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("admin_actions").insert({
    admin_id: adminId,
    action,
    target_type: "profile",
    target_id: id,
    details: { email: targetEmail ?? null },
  });

  return NextResponse.json({ success: true });
}
