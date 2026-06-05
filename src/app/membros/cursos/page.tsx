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

  // Progresso por produto: total de aulas + concluídas
  const cursos = await Promise.all(
    (acessos ?? []).map(async (acesso) => {
      const produto = Array.isArray(acesso.produtos) ? acesso.produtos[0] : acesso.produtos;
      if (!produto) return null;

      const [{ count: totalAulas }, { count: concluidas }] = await Promise.all([
        supabase
          .from("aulas")
          .select("id", { count: "exact", head: true })
          .eq("produto_id", produto.id),
        supabase
          .from("progresso_aulas")
          .select("aula_id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("produto_id", produto.id)
          .eq("concluida", true),
      ]);

      const total = totalAulas ?? 0;
      const feitas = Math.min(concluidas ?? 0, total);
      const percentual = total > 0 ? Math.round((feitas / total) * 100) : 0;

      return { acessoId: acesso.id, produto, total, feitas, percentual };
    })
  );

  const cursosValidos = cursos.filter(Boolean) as NonNullable<(typeof cursos)[number]>[];

  return (
    <MembrosShell>
      <div className="mx-auto max-w-[1200px] px-5 py-10">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#555" }}>
            Meus cursos
          </p>
          <h1 className="mt-2 font-serif text-[28px] text-white">Continue aprendendo</h1>
          <p className="mt-1 text-sm" style={{ color: "#888" }}>{user.email}</p>
        </div>

        {cursosValidos.length === 0 ? (
          <div
            className="rounded-[24px] p-12 text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <span className="text-3xl">📚</span>
            </div>
            <p className="font-semibold text-white">Você ainda não tem cursos</p>
            <p className="mt-1 text-sm" style={{ color: "#888" }}>
              Quando comprar um produto com área de membros, ele aparece aqui.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cursosValidos.map(({ acessoId, produto, total, feitas, percentual }) => (
              <Link
                key={acessoId}
                href={`/membros/${produto.slug}`}
                className="group block overflow-hidden rounded-[16px] transition"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                // hover handled via group + inline can't; rely on subtle border
              >
                {/* Thumb 16/10 */}
                <div
                  className="relative"
                  style={{
                    aspectRatio: "16 / 10",
                    background: produto.capa_url
                      ? `url(${produto.capa_url}) center/cover`
                      : "linear-gradient(135deg,#1a1a1a 0%,#0f0f0f 100%)",
                    borderBottom: "1px solid rgba(200,16,46,0.1)",
                  }}
                >
                  {!produto.capa_url && (
                    <div
                      className="absolute bottom-3 left-3 rounded-[6px]"
                      style={{ width: 32, height: 32, background: "rgba(200,16,46,0.25)" }}
                    />
                  )}
                </div>

                <div className="p-5">
                  <h2 className="text-[15px] font-medium text-white transition group-hover:text-[#C8102E]">
                    {produto.nome}
                  </h2>

                  {/* Progresso */}
                  <div className="mt-4">
                    <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentual}%`, background: percentual === 100 ? "#4ADE80" : "#C8102E" }}
                      />
                    </div>
                    <p className="mt-2 text-xs" style={{ color: "#888" }}>
                      {feitas} de {total} aulas · {percentual}%
                    </p>
                  </div>

                  <p className="mt-4 text-sm font-semibold" style={{ color: "#C8102E" }}>
                    Continuar →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MembrosShell>
  );
}
