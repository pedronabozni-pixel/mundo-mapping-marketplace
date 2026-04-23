import Link from "next/link";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.75),_transparent_28%),linear-gradient(180deg,_#fffdf7_0%,_#f5f7f1_45%,_#eef3ee_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-8 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-30 mt-4 rounded-[28px] border border-white/70 bg-white/70 px-5 py-4 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ffb86b,#6dd3a0)] text-xl shadow-lg">
                🍲
              </div>
              <div>
                <p className="font-sans text-lg font-semibold tracking-tight text-slate-900">Geladeira Viva</p>
                <p className="text-sm text-slate-500">Descubra o que cozinhar com o que você já tem</p>
              </div>
            </Link>

            <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-600">
              <Link href="/" className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900">
                Início
              </Link>
              <Link href="/buscar" className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900">
                Buscar
              </Link>
              <Link href="/favoritos" className="rounded-full px-4 py-2 transition hover:bg-emerald-50 hover:text-emerald-900">
                Favoritos
              </Link>
              <Link href="/painel" className="rounded-full bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800">
                Painel admin
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 py-8">{children}</main>

        <footer className="mt-8 rounded-[28px] border border-white/70 bg-white/65 px-6 py-6 text-sm text-slate-500 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.3)] backdrop-blur-xl">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p>Geladeira Viva transforma ingredientes soltos em decisões rápidas de refeição.</p>
            <p>Arquitetura pronta para autenticação, favoritos persistidos e migração futura para banco real.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
