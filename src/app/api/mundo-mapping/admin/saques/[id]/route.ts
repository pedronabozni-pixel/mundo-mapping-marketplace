import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const { status } = await req.json() as { status: string };

  const admin = createAdminClient();
  const { error } = await admin.from("solicitacoes_saque").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("admin_actions").insert({
    admin_id: adminId,
    action: `saque_${status}`,
    target_type: "saque",
    target_id: id,
  });

  return NextResponse.json({ success: true });
}
