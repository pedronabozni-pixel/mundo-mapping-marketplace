"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MappingPartnersLogo } from "@/components/mundo-mapping/mapping-partners-logo";
import { useInactivityLogout } from "@/hooks/use-inactivity-logout";

const NAV = [
  { href: "/mundo-mapping/admin", label: "Dashboard", exact: true },
  { href: "/mundo-mapping/admin/empresas", label: "Empresas e Produtores" },
  { href: "/mundo-mapping/admin/influenciadores", label: "Influenciadores" },
  { href: "/mundo-mapping/admin/produtos", label: "Produtos" },
  { href: "/mundo-mapping/admin/saques", label: "Saques" },
  { href: "/mundo-mapping/admin/relatorios", label: "Relatórios" },
  { href: "/mundo-mapping/admin/configuracoes", label: "Configurações" },
];

export function AdminShell({
  children,
  adminName,
}: {
  children: React.ReactNode;
  adminName: string;
}) {
  useInactivityLogout("/mundo-mapping/admin/login");
  const pathname = usePathname();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/mundo-mapping/admin/login";
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      {/* ── Sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-[rgba(255,255,255,0.06)] bg-[#060606]">
        {/* Brand */}
        <div className="border-b border-[rgba(255,255,255,0.06)] px-5 py-4">
          <MappingPartnersLogo onDark size="sm" subtitle="Admin" />
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-2.5 py-3">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "text-white"
                    : "text-[#888] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#aaa]"
                }`}
                href={item.href}
                key={item.href}
                style={
                  active
                    ? { background: "rgba(200,16,46,0.12)", borderLeft: "2px solid #C8102E" }
                    : { borderLeft: "2px solid transparent" }
                }
              >
                {active ? (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C8102E]" />
                ) : (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-transparent" />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User / logout */}
        <div className="border-t border-[rgba(255,255,255,0.06)] p-3">
          <div className="mb-2.5 flex items-center gap-2.5 px-1">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(255,255,255,0.04)] text-[10px] font-bold text-[#888]">
              {adminName.slice(0, 1).toUpperCase()}
            </div>
            <p className="min-w-0 truncate text-xs font-medium text-[#888]">{adminName}</p>
          </div>
          <button
            className="w-full rounded-xl py-2 text-xs font-semibold text-[#555] transition hover:bg-[rgba(255,255,255,0.06)] hover:text-[#aaa]"
            onClick={logout}
            type="button"
          >
            Sair da conta
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="ml-56 min-h-screen flex-1 bg-[#0a0a0a]">{children}</div>
    </div>
  );
}
