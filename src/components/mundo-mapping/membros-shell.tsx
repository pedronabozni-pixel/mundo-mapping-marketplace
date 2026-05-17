"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { MappingPartnersLogo } from "@/components/mundo-mapping/mapping-partners-logo";

type Props = {
  children: ReactNode;
  /** Título secundário exibido ao lado do logo (ex: nome do curso) */
  titulo?: string;
  /** Href do link "voltar" no breadcrumb */
  voltarHref?: string;
  voltarLabel?: string;
};

export function MembrosShell({ children, titulo, voltarHref, voltarLabel }: Props) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/membros");
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff7f7_0%,#f6f7fb_24%,#f4f5f7_100%)]">
      <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-4 px-5">
          <Link href="/membros/cursos">
            <MappingPartnersLogo size="sm" subtitle="Área de Membros" />
          </Link>

          {voltarHref && (
            <>
              <span className="text-zinc-300">/</span>
              <Link
                className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
                href={voltarHref}
              >
                {voltarLabel}
              </Link>
            </>
          )}

          {titulo && (
            <>
              <span className="text-zinc-300">/</span>
              <span className="truncate text-sm font-semibold text-zinc-800">{titulo}</span>
            </>
          )}

          <div className="ml-auto">
            <button
              className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
              onClick={handleLogout}
              type="button"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}

/** Navbar leve para o player de aula (fundo escuro, logo claro) */
export function MembrosPlayerNavbar({
  titulo,
  voltarHref,
  voltarLabel,
}: {
  titulo?: string;
  voltarHref: string;
  voltarLabel: string;
}) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/membros");
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b border-white/10 bg-[#181a20] px-5">
      <Link href={voltarHref} className="flex items-center gap-2 text-white/60 transition hover:text-white">
        <MappingPartnersLogo onDark size="sm" />
      </Link>

      <span className="text-white/20">/</span>

      <Link
        className="text-sm font-medium text-white/60 transition hover:text-white"
        href={voltarHref}
      >
        {voltarLabel}
      </Link>

      {titulo && (
        <>
          <span className="text-white/20">/</span>
          <span className="truncate text-sm font-semibold text-white/90">{titulo}</span>
        </>
      )}

      <div className="ml-auto">
        <button
          className="inline-flex h-8 items-center justify-center rounded-lg border border-white/10 px-3 text-sm font-semibold text-white/60 transition hover:border-white/20 hover:text-white"
          onClick={handleLogout}
          type="button"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
