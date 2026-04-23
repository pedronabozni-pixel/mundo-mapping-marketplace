import { AdminClient } from "@/components/kitchen/admin-client";
import { SiteShell } from "@/components/kitchen/site-shell";

export default function AdminPage() {
  return (
    <SiteShell>
      <AdminClient />
    </SiteShell>
  );
}
