import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function InfluenciadorDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/mundo-mapping/influenciador/login");
  }

  // Set user_type for Google OAuth users who don't have it yet
  if (!user.user_metadata?.user_type) {
    await supabase.auth.updateUser({ data: { user_type: "influenciador" } });
  }

  redirect("/mundo-mapping/influenciadores");
}
