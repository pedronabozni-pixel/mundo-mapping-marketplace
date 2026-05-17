import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MembrosShell } from "@/components/mundo-mapping/membros-shell";

export const dynamic = "force-dynamic";

export default async function MeusCursosPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/membros");

  const { data: acessos } = await supabase
    .from("acessos_membros")
    .select(`
      id,
      produto_id,
      created_at,
      expira_em,
      produtos (
        id, slug, nome, capa_url, checkout_headline
      )
    `)
    .eq("comprador_email", user.email!)
    .eq("ativo", true)
    .order("created_at", { ascending: false });

  return (
    <MembrosShell>
      <div className="mx-auto max-w-[1200px] px-5 py-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
            Área de Membros
          </p>
          <h1 className="mt-2 text-[26px] font-semibold tracking-tight text-zinc-950">
            Meus Cursos
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
        </div>

        {!acessos || acessos.length === 0 ? (
          <div className="rounded-[24px] border border-zinc-200 bg-white p-12 text-center shadow-[0_24px_80px_-54px_rgba(24,24,27,0.35)]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
              <span className="text-3xl">📚</span>
            </div>
            <p className="font-semibold text-zinc-950">Nenhum curso disponível</p>
            <p className="mt-1 text-sm text-zinc-500">
              Você ainda não tem acesso a nenhum curso.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {acessos.map((acesso) => {
              const produto = Array.isArray(acesso.produtos)
                ? acesso.produtos[0]
                : acesso.produtos;
              if (!produto) return null;
              return (
                <Link
                  key={acesso.id}
                  href={`/membros/${produto.slug}`}
                  className="group block overflow-hidden rounded-[22px] border border-zinc-200 bg-white shadow-[0_18px_50px_-44px_rgba(24,24,27,0.24)] transition hover:border-zinc-300 hover:shadow-[0_24px_60px_-40px_rgba(24,24,27,0.3)]"
                >
                  <div
                    className="h-44 bg-zinc-100"
                    style={{
                      background: produto.capa_url
                        ? `url(${produto.capa_url}) center/cover`
                        : "linear-gradient(135deg,#fef2f2,#fee2e2)",
                    }}
                  >
                    {!produto.capa_url && (
                      <div className="flex h-full items-center justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
                          <span className="text-3xl">🎓</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h2 className="text-base font-semibold text-zinc-950 group-hover:text-red-700 transition">
                      {produto.nome}
                    </h2>
                    {produto.checkout_headline && (
                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-zinc-500">
                        {produto.checkout_headline}
                      </p>
                    )}
                    <p className="mt-4 text-sm font-semibold text-red-600">
                      Acessar curso →
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </MembrosShell>
  );
}
