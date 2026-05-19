"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MappingPartnersLogo } from "@/components/mundo-mapping/mapping-partners-logo";

const NAV = [
  { href: "/mundo-mapping/admin", label: "Dashboard", exact: true },
  { href: "/mundo-mapping/admin/empresas", label: "Empresas" },
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
  const pathname = usePathname();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/mundo-mapping/admin/login";
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* ── Sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-zinc-800/80 bg-zinc-950">
        {/* Brand */}
        <div className="border-b border-zinc-800/80 px-5 py-4">
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
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"
                }`}
                href={item.href}
                key={item.href}
              >
                {active ? (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                ) : (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-transparent" />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User / logout */}
        <div className="border-t border-zinc-800/80 p-3">
          <div className="mb-2.5 flex items-center gap-2.5 px-1">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400">
              {adminName.slice(0, 1).toUpperCase()}
            </div>
            <p className="min-w-0 truncate text-xs font-medium text-zinc-500">{adminName}</p>
          </div>
          <button
            className="w-full rounded-xl py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300"
            onClick={logout}
            type="button"
          >
            Sair da conta
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="ml-56 min-h-screen flex-1 bg-zinc-950">{children}</div>
    </div>
  );
}
