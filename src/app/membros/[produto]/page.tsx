import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MembrosShell } from "@/components/mundo-mapping/membros-shell";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ produto: string }>;
};

export default async function CursoOverviewPage({ params }: Props) {
  const { produto: slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/membros");

  const { data: produtoData } = await supabase
    .from("produtos")
    .select("id, slug, nome, capa_url, checkout_headline, checkout_subheadline")
    .eq("slug", slug)
    .maybeSingle();

  if (!produtoData) notFound();

  const { data: acesso } = await supabase
    .from("acessos_membros")
    .select("id")
    .eq("produto_id", produtoData.id)
    .eq("comprador_email", user.email!)
    .eq("ativo", true)
    .maybeSingle();

  if (!acesso) redirect("/membros/cursos");

  const { data: modulos } = await supabase
    .from("modulos")
    .select(`
      id, titulo, descricao, ordem,
      aulas (
        id, titulo, duracao_minutos, ordem, liberado_em
      )
    `)
    .eq("produto_id", produtoData.id)
    .order("ordem");

  const { data: progressoData } = await supabase
    .from("progresso_aulas")
    .select("aula_id, concluida")
    .eq("user_id", user.id)
    .eq("produto_id", produtoData.id);

  const progressoMap = new Map(
    (progressoData ?? []).map((p) => [p.aula_id, p.concluida])
  );

  const totalAulas =
    modulos?.reduce((acc, m) => acc + (m.aulas?.length ?? 0), 0) ?? 0;
  const concluidas = Array.from(progressoMap.values()).filter(Boolean).length;
  const percentual = totalAulas > 0 ? Math.round((concluidas / totalAulas) * 100) : 0;

  let primeiraAulaPendente: { moduloId: string; aulaId: string } | null = null;
  outer: for (const mod of modulos ?? []) {
    for (const aula of [...(mod.aulas ?? [])].sort((a, b) => a.ordem - b.ordem)) {
      if (!progressoMap.get(aula.id)) {
        primeiraAulaPendente = { moduloId: mod.id, aulaId: aula.id };
        break outer;
      }
    }
  }

  const agora = new Date();

  return (
    <MembrosShell voltarHref="/membros/cursos" voltarLabel="Meus Cursos" titulo={produtoData.nome}>
      {/* Hero do curso */}
      <div className="border-b border-zinc-200/80 bg-white">
        <div className="mx-auto max-w-[1200px] px-5 py-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            {produtoData.capa_url && (
              <div
                className="h-48 w-full shrink-0 rounded-[20px] bg-zinc-100 lg:h-40 lg:w-64"
                style={{ background: `url(${produtoData.capa_url}) center/cover` }}
              />
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
                {produtoData.nome}
              </h1>
              {produtoData.checkout_headline && (
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  {produtoData.checkout_headline}
                </p>
              )}

              {/* Progresso */}
              <div className="mt-5 max-w-sm">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-zinc-500">
                    {concluidas} de {totalAulas} aulas concluídas
                  </span>
                  <span className="font-semibold text-red-600">{percentual}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-red-600 transition-all duration-500"
                    style={{ width: `${percentual}%` }}
                  />
                </div>
              </div>

              {/* CTA */}
              <div className="mt-6">
                {primeiraAulaPendente ? (
                  <Link
                    href={`/membros/${slug}/${primeiraAulaPendente.moduloId}/${primeiraAulaPendente.aulaId}`}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-6 text-sm font-bold text-white shadow-[0_18px_40px_-25px_rgba(220,38,38,0.95)] transition hover:bg-red-700"
                  >
                    {concluidas === 0 ? "Começar curso" : "Continuar de onde parei"}
                  </Link>
                ) : totalAulas > 0 ? (
                  <span className="inline-flex h-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-6 text-sm font-bold text-emerald-700">
                    ✓ Curso concluído!
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="mx-auto max-w-[900px] px-5 py-8">
        <h2 className="mb-5 text-lg font-semibold tracking-tight text-zinc-950">
          Conteúdo do curso
        </h2>

        {!modulos || modulos.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-zinc-200 bg-white p-10 text-center">
            <p className="text-sm text-zinc-400">
              As aulas estão sendo preparadas. Em breve!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...modulos]
              .sort((a, b) => a.ordem - b.ordem)
              .map((mod, modIdx) => {
                const aulasOrdenadas = [...(mod.aulas ?? [])].sort(
                  (a, b) => a.ordem - b.ordem
                );
                const aulasConcluidas = aulasOrdenadas.filter(
                  (a) => progressoMap.get(a.id)
                ).length;

                return (
                  <div
                    key={mod.id}
                    className="overflow-hidden rounded-[20px] border border-zinc-200 bg-white shadow-[0_4px_20px_-8px_rgba(24,24,27,0.08)]"
                  >
                    {/* Cabeçalho do módulo */}
                    <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-5 py-3.5">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                          Módulo {modIdx + 1}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-zinc-950">
                          {mod.titulo}
                        </p>
                      </div>
                      <span className="text-xs text-zinc-400">
                        {aulasConcluidas}/{aulasOrdenadas.length}
                      </span>
                    </div>

                    {/* Aulas */}
                    {aulasOrdenadas.map((aula, aulaIdx) => {
                      const concluida = progressoMap.get(aula.id) === true;
                      const liberada =
                        !aula.liberado_em || new Date(aula.liberado_em) <= agora;

                      if (liberada) {
                        return (
                          <Link
                            key={aula.id}
                            href={`/membros/${slug}/${mod.id}/${aula.id}`}
                            className="flex items-center gap-3.5 border-b border-zinc-100 px-5 py-3.5 transition last:border-b-0 hover:bg-zinc-50"
                          >
                            <div
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                concluida
                                  ? "bg-red-600 text-white"
                                  : "border-2 border-zinc-200 text-zinc-400"
                              }`}
                            >
                              {concluida ? "✓" : aulaIdx + 1}
                            </div>
                            <span
                              className={`flex-1 text-sm ${
                                concluida ? "text-zinc-400 line-through" : "text-zinc-700"
                              }`}
                            >
                              {aula.titulo}
                            </span>
                            {aula.duracao_minutos && (
                              <span className="text-xs text-zinc-400">
                                {aula.duracao_minutos}min
                              </span>
                            )}
                          </Link>
                        );
                      }

                      return (
                        <div
                          key={aula.id}
                          className="flex items-center gap-3.5 border-b border-zinc-100 px-5 py-3.5 last:border-b-0 opacity-50"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-zinc-200 text-xs text-zinc-400">
                            🔒
                          </div>
                          <span className="flex-1 text-sm text-zinc-500">{aula.titulo}</span>
                          <span className="text-xs text-zinc-400">
                            {new Date(aula.liberado_em!).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </MembrosShell>
  );
}
