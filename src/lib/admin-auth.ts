import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminSession = { userId: string; accessToken: string };

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    // Pass access token so createAdminClient works even without SERVICE_ROLE_KEY
    const admin = createAdminClient(session.access_token);
    const { data: p } = await admin
      .from("profiles")
      .select("user_type")
      .eq("id", session.user.id)
      .single();
    if (p?.user_type !== "admin") return null;
    return { userId: session.user.id, accessToken: session.access_token };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<string | null> {
  const s = await getAdminSession();
  return s?.userId ?? null;
}
