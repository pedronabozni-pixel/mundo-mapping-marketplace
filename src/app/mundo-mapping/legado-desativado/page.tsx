import Link from "next/link";

const legacyRoutes = [
  "/app",
  "/admin",
  "/loja",
  "/painel",
  "/buscar",
  "/favoritos",
  "/receitas",
  "/resultados",
  "/activate-account",
  "/login",
  "/reset-password"
];

export const metadata = {
  title: "Mundo Mapping | Área legada desativada"
};

export default function LegacyDisabledPage() {
  return (
    <main className="min-h-screen bg-[#f6f3ee] px-6 py-12 text-[#161616]">
      <div className="mx-auto max-w-3xl rounded-[28px] border border-[#e7dfd4] bg-white p-8 shadow-[0_24px_80px_rgba(23,23,23,0.08)]">
        <div className="mb-6 inline-flex rounded-full border border-[#f2c7c9] bg-[#fff5f5] px-4 py-1 text-sm font-medium text-[#c4363f]">
          Área legada isolada
        </div>

        <h1 className="text-3xl font-semibold tracking-[-0.03em]">Esta área não faz mais parte do produto principal</h1>
        <p className="mt-4 text-base leading-7 text-[#5e5a55]">
          Este repositório foi reorganizado para priorizar apenas o marketplace da Mundo Mapping. As rotas antigas do
          projeto-base continuam no código como legado técnico, mas não devem mais ser usadas como entrada principal
          do sistema.
        </p>

        <div className="mt-8 rounded-2xl border border-[#efe8de] bg-[#faf8f5] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7b746c]">Rotas legadas isoladas</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {legacyRoutes.map((route) => (
              <span
                key={route}
                className="rounded-full border border-[#e4dbcf] bg-white px-3 py-1 text-sm text-[#6a645d]"
              >
                {route}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/mundo-mapping/afiliados"
            className="rounded-full bg-[#d72630] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#ba1f28]"
          >
            Ir para a área da empresa
          </Link>
          <Link
            href="/mundo-mapping/influenciadores"
            className="rounded-full border border-[#ddd4ca] px-5 py-3 text-sm font-semibold text-[#1c1b1a] transition hover:bg-[#f5f1eb]"
          >
            Ir para o portal do influenciador
          </Link>
        </div>
      </div>
    </main>
  );
}
