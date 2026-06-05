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
  outer: for (const mod of [...(modulos ?? [])].sort((a, b) => a.ordem - b.ordem)) {
    for (const aula of [...(mod.aulas ?? [])].sort((a, b) => a.ordem - b.ordem)) {
      const liberada = !aula.liberado_em || new Date(aula.liberado_em) <= new Date();
      if (liberada && !progressoMap.get(aula.id)) {
        primeiraAulaPendente = { moduloId: mod.id, aulaId: aula.id };
        break outer;
      }
    }
  }

  const agora = new Date();

  return (
    <MembrosShell voltarHref="/membros/cursos" voltarLabel="Meus cursos" titulo={produtoData.nome}>
      {/* Hero do curso */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto max-w-[1200px] px-5 py-10">
          <div className="grid gap-8 lg:grid-cols-[320px_1fr] lg:items-start">
            {/* Capa */}
            <div
              className="relative w-full"
              style={{
                aspectRatio: "16 / 10",
                borderRadius: 18,
                background: produtoData.capa_url
                  ? `url(${produtoData.capa_url}) center/cover`
                  : "linear-gradient(135deg,#1a1a1a 0%,#0f0f0f 100%)",
                border: "1px solid rgba(200,16,46,0.1)",
              }}
            >
              {!produtoData.capa_url && (
                <div
                  className="absolute bottom-4 left-4 rounded-[6px]"
                  style={{ width: 36, height: 36, background: "rgba(200,16,46,0.25)" }}
                />
              )}
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: "#C8102E" }}>
                Curso completo
              </p>
              <h1 className="mt-2 font-serif text-[28px] text-white">{produtoData.nome}</h1>
              {produtoData.checkout_headline && (
                <p className="mt-2 text-sm leading-6" style={{ color: "#888" }}>
                  {produtoData.checkout_headline}
                </p>
              )}

              {/* Progresso */}
              <div className="mt-5 max-w-sm">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span style={{ color: "#888" }}>
                    {concluidas} de {totalAulas} aulas
                  </span>
                  <span className="font-semibold" style={{ color: percentual === 100 ? "#4ADE80" : "#C8102E" }}>
                    {percentual}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentual}%`, background: percentual === 100 ? "#4ADE80" : "#C8102E" }}
                  />
                </div>
              </div>

              {/* CTA */}
              <div className="mt-6 flex flex-wrap gap-3">
                {primeiraAulaPendente ? (
                  <Link
                    href={`/membros/${slug}/${primeiraAulaPendente.moduloId}/${primeiraAulaPendente.aulaId}`}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-[#C8102E] px-6 text-sm font-bold text-white shadow-[0_18px_40px_-25px_rgba(200,16,46,0.95)] transition hover:bg-[#A30D24]"
                  >
                    {concluidas === 0 ? "Começar curso" : "Continuar de onde parei"}
                  </Link>
                ) : totalAulas > 0 ? (
                  <span
                    className="inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-bold"
                    style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ADE80" }}
                  >
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
        <h2 className="mb-5 font-serif text-[22px] text-white">Conteúdo do curso</h2>

        {!modulos || modulos.length === 0 ? (
          <div
            className="rounded-[20px] p-10 text-center"
            style={{ border: "1px dashed rgba(255,255,255,0.06)" }}
          >
            <p className="text-sm" style={{ color: "#555" }}>
              As aulas estão sendo preparadas. Em breve!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...modulos]
              .sort((a, b) => a.ordem - b.ordem)
              .map((mod, modIdx) => {
                const aulasOrdenadas = [...(mod.aulas ?? [])].sort((a, b) => a.ordem - b.ordem);
                const aulasConcluidas = aulasOrdenadas.filter((a) => progressoMap.get(a.id)).length;
                const temAtual =
                  primeiraAulaPendente && mod.id === primeiraAulaPendente.moduloId;

                const status =
                  aulasOrdenadas.length > 0 && aulasConcluidas === aulasOrdenadas.length
                    ? { label: "Concluído", color: "#4ADE80" }
                    : aulasConcluidas > 0 || temAtual
                      ? { label: "Em andamento", color: "#C8102E" }
                      : { label: `${aulasOrdenadas.length} aula${aulasOrdenadas.length !== 1 ? "s" : ""}`, color: "#888" };

                return (
                  <div
                    key={mod.id}
                    className="overflow-hidden rounded-[16px]"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: temAtual ? "1px solid rgba(200,16,46,0.2)" : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {/* Cabeçalho do módulo */}
                    <div
                      className="flex items-center justify-between px-5 py-3.5"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)" }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-serif text-sm"
                          style={{ background: "rgba(200,16,46,0.1)", color: "#C8102E" }}
                        >
                          {modIdx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white">{mod.titulo}</p>
                          <p className="mt-0.5 text-[11px]" style={{ color: "#555" }}>
                            {aulasOrdenadas.length} aula{aulasOrdenadas.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: status.color }}>
                        {status.label}
                      </span>
                    </div>

                    {/* Aulas */}
                    {aulasOrdenadas.map((aula, aulaIdx) => {
                      const concluida = progressoMap.get(aula.id) === true;
                      const liberada = !aula.liberado_em || new Date(aula.liberado_em) <= agora;
                      const isAtual =
                        primeiraAulaPendente?.aulaId === aula.id;

                      if (liberada) {
                        return (
                          <Link
                            key={aula.id}
                            href={`/membros/${slug}/${mod.id}/${aula.id}`}
                            className="flex items-center gap-3.5 px-5 py-3.5 transition last:border-b-0"
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                          >
                            <div
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                              style={
                                concluida
                                  ? { background: "rgba(74,222,128,0.15)", color: "#4ADE80" }
                                  : isAtual
                                    ? { background: "rgba(200,16,46,0.15)", color: "#C8102E" }
                                    : { border: "2px solid rgba(255,255,255,0.1)", color: "#555" }
                              }
                            >
                              {concluida ? "✓" : isAtual ? "▶" : aulaIdx + 1}
                            </div>
                            <span
                              className="flex-1 text-sm"
                              style={{ color: concluida ? "#555" : "#fff", textDecoration: concluida ? "line-through" : "none" }}
                            >
                              {aula.titulo}
                            </span>
                            {aula.duracao_minutos && (
                              <span className="text-xs" style={{ color: "#555" }}>
                                {aula.duracao_minutos}min
                              </span>
                            )}
                          </Link>
                        );
                      }

                      return (
                        <div
                          key={aula.id}
                          className="flex items-center gap-3.5 px-5 py-3.5 last:border-b-0"
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", opacity: 0.5 }}
                        >
                          <div
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs"
                            style={{ border: "2px solid rgba(255,255,255,0.1)", color: "#555" }}
                          >
                            🔒
                          </div>
                          <span className="flex-1 text-sm" style={{ color: "#888" }}>{aula.titulo}</span>
                          <span className="text-xs" style={{ color: "#555" }}>
                            Libera em {new Date(aula.liberado_em!).toLocaleDateString("pt-BR")}
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
