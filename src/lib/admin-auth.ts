import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function requireAdmin(): Promise<string | null> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const admin = createAdminClient();
    const { data: p } = await admin
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single();
    return p?.user_type === "admin" ? user.id : null;
  } catch {
    return null;
  }
}
