import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function InfluenciadorDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/mundo-mapping/influenciador/login");
  }

  if (!user.user_metadata?.user_type) {
    await supabase.auth.updateUser({ data: { user_type: "influenciador" } });
  }

  await supabase.from("profiles").upsert(
    { id: user.id, user_type: "influenciador" },
    { onConflict: "id", ignoreDuplicates: true }
  );

  redirect("/mundo-mapping/influenciadores");
}
