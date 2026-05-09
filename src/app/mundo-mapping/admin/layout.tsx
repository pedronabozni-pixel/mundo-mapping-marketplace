import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/mundo-mapping/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  if (pathname === "/mundo-mapping/admin/login") {
    return <>{children}</>;
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect("/mundo-mapping/admin/login");

  // Use admin client (service role if available, else user token) to bypass RLS on profiles
  const adminSupabase = createAdminClient(session.access_token);
  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("user_type, full_name, email")
    .eq("id", session.user.id)
    .single();

  if (profile?.user_type !== "admin") redirect("/mundo-mapping/admin/login");

  return (
    <AdminShell adminName={profile.full_name ?? profile.email ?? "Admin"}>
      {children}
    </AdminShell>
  );
}
