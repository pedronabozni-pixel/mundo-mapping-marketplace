"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  children: ReactNode;
  /** Título secundário exibido ao lado do logo (ex: nome do curso) */
  titulo?: string;
  /** Href do link "voltar" no breadcrumb */
  voltarHref?: string;
  voltarLabel?: string;
};

function MemberLogo({ onDark = true }: { onDark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex items-center justify-center shrink-0"
        style={{ width: 28, height: 28, background: "#C8102E", borderRadius: 7 }}
      >
        <span className="font-sans font-extrabold text-white" style={{ fontSize: 16, lineHeight: 1 }}>M</span>
      </div>
      <span
        className="text-[11px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: onDark ? "#888" : "#555" }}
      >
        Área de Membros
      </span>
    </div>
  );
}

function LogoutButton({ small = false }: { small?: boolean }) {
  const router = useRouter();
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/membros");
  }
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl text-sm font-semibold transition ${small ? "h-8 px-3" : "h-9 px-4"}`}
      onClick={handleLogout}
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#888" }}
      type="button"
    >
      Sair
    </button>
  );
}

export function MembrosShell({ children, titulo, voltarHref, voltarLabel }: Props) {
  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      <header
        className="sticky top-0 z-20 backdrop-blur"
        style={{ background: "rgba(6,6,6,0.9)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-4 px-5">
          <Link href="/membros/cursos">
            <MemberLogo />
          </Link>

          {voltarHref && (
            <>
              <span style={{ color: "#333" }}>/</span>
              <Link
                className="text-sm font-medium transition hover:text-white"
                href={voltarHref}
                style={{ color: "#888" }}
              >
                {voltarLabel}
              </Link>
            </>
          )}

          {titulo && (
            <>
              <span style={{ color: "#333" }}>/</span>
              <span className="truncate text-sm font-semibold text-white">{titulo}</span>
            </>
          )}

          <div className="ml-auto">
            <LogoutButton />
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}

/** Navbar do player de aula (dark) */
export function MembrosPlayerNavbar({
  titulo,
  voltarHref,
  voltarLabel,
}: {
  titulo?: string;
  voltarHref: string;
  voltarLabel: string;
}) {
  return (
    <header
      className="flex h-14 items-center gap-4 px-5"
      style={{ background: "#060606", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <Link href={voltarHref} className="flex items-center gap-2 transition hover:opacity-80">
        <MemberLogo />
      </Link>

      <span style={{ color: "#333" }}>/</span>

      <Link
        className="text-sm font-medium transition hover:text-white"
        href={voltarHref}
        style={{ color: "#888" }}
      >
        {voltarLabel}
      </Link>

      {titulo && (
        <>
          <span style={{ color: "#333" }}>/</span>
          <span className="truncate text-sm font-semibold text-white">{titulo}</span>
        </>
      )}

      <div className="ml-auto">
        <LogoutButton small />
      </div>
    </header>
  );
}
