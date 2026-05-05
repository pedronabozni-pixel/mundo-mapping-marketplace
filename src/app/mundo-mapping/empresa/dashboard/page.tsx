import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function EmpresaDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/mundo-mapping/empresa/login");
  }

  if (!user.user_metadata?.user_type) {
    await supabase.auth.updateUser({ data: { user_type: "empresa" } });
  }

  await supabase.from("profiles").upsert(
    { id: user.id, user_type: "empresa", plano: "associate" },
    { onConflict: "id", ignoreDuplicates: true }
  );

  redirect("/mundo-mapping/afiliados");
}
