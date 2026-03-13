import { MemberNav } from "@/components/member-nav";
import { requireMemberSession } from "@/lib/access";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  await requireMemberSession();

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-4 px-3 py-3 md:grid-cols-[220px_1fr] md:p-4">
      <MemberNav />
      <section className="min-w-0 space-y-4">{children}</section>
    </main>
  );
}
