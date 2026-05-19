import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/membros", process.env.NEXT_PUBLIC_SITE_URL ?? "https://mundo-mapping-marketplace-production.up.railway.app"));
}
