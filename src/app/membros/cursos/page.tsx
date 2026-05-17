import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

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
    <div style={{
      minHeight: "100vh",
      background: "#0f0f0f",
      fontFamily: "Inter, system-ui, sans-serif",
      color: "#fff",
    }}>
      <header style={{
        background: "#1a1a1a",
        borderBottom: "1px solid #2a2a2a",
        padding: "1rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: "36px",
            height: "36px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            borderRadius: "9px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.1rem",
          }}>🎓</div>
          <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>Área de Membros</span>
        </div>
        <form action="/api/membros/logout" method="POST">
          <button type="submit" style={{
            background: "transparent",
            border: "1px solid #2a2a2a",
            color: "#9ca3af",
            borderRadius: "8px",
            padding: "0.5rem 1rem",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}>
            Sair
          </button>
        </form>
      </header>

      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Meus Cursos
        </h1>
        <p style={{ color: "#6b7280", marginBottom: "2rem", fontSize: "0.9rem" }}>
          {user.email}
        </p>

        {!acessos || acessos.length === 0 ? (
          <div style={{
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: "16px",
            padding: "3rem",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📚</div>
            <p style={{ color: "#6b7280", fontSize: "1rem" }}>
              Você ainda não tem acesso a nenhum curso.
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.25rem",
          }}>
            {acessos.map((acesso) => {
              const produto = Array.isArray(acesso.produtos) ? acesso.produtos[0] : acesso.produtos;
              if (!produto) return null;
              return (
                <Link
                  key={acesso.id}
                  href={`/membros/${produto.slug}`}
                  style={{ textDecoration: "none" }}
                >
                  <div style={{
                    background: "#1a1a1a",
                    border: "1px solid #2a2a2a",
                    borderRadius: "16px",
                    overflow: "hidden",
                    transition: "border-color 0.2s, transform 0.2s",
                    cursor: "pointer",
                  }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "#6366f1";
                      (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "#2a2a2a";
                      (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{
                      height: "160px",
                      background: produto.capa_url
                        ? `url(${produto.capa_url}) center/cover`
                        : "linear-gradient(135deg, #1e1b4b, #312e81)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {!produto.capa_url && (
                        <span style={{ fontSize: "3rem" }}>🎓</span>
                      )}
                    </div>
                    <div style={{ padding: "1.25rem" }}>
                      <h2 style={{
                        color: "#fff",
                        fontSize: "1rem",
                        fontWeight: 700,
                        marginBottom: "0.4rem",
                      }}>
                        {produto.nome}
                      </h2>
                      {produto.checkout_headline && (
                        <p style={{
                          color: "#6b7280",
                          fontSize: "0.825rem",
                          lineHeight: 1.4,
                          marginBottom: "1rem",
                        }}>
                          {produto.checkout_headline}
                        </p>
                      )}
                      <span style={{
                        display: "inline-block",
                        background: "#1e1b4b",
                        color: "#a5b4fc",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        padding: "0.3rem 0.7rem",
                        borderRadius: "6px",
                      }}>
                        Acessar curso →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
