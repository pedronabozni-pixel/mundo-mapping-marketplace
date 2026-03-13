import { AdminNav } from "@/components/admin-nav";
import { requireAdminSession } from "@/lib/access";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminSession();

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-4 px-3 py-3 md:grid-cols-[220px_1fr] md:p-4">
      <AdminNav />
      <section className="min-w-0 space-y-4">{children}</section>
    </main>
  );
}
