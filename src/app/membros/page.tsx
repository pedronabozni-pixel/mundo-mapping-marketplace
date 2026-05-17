"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function MembrosLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [modo, setModo] = useState<"login" | "cadastro">("login");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [msg, setMsg] = useState("");

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setMsg("");
    setLoading(true);

    try {
      if (modo === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw new Error("E-mail ou senha incorretos.");
        router.push("/membros/cursos");
      } else {
        if (!nome.trim()) throw new Error("Informe seu nome.");
        const { error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { data: { nome } },
        });
        if (error) throw new Error(error.message);
        setMsg("Conta criada! Verifique seu e-mail para confirmar o cadastro.");
        setModo("login");
      }
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0f0f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Inter, system-ui, sans-serif",
      padding: "1rem",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        background: "#1a1a1a",
        borderRadius: "16px",
        padding: "2.5rem",
        border: "1px solid #2a2a2a",
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: "56px",
            height: "56px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
            fontSize: "1.5rem",
          }}>
            🎓
          </div>
          <h1 style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
            Área de Membros
          </h1>
          <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {modo === "login" ? "Acesse seus cursos e conteúdos" : "Crie sua conta de aluno"}
          </p>
        </div>

        <div style={{
          display: "flex",
          background: "#111",
          borderRadius: "10px",
          padding: "4px",
          marginBottom: "1.5rem",
        }}>
          {(["login", "cadastro"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setModo(m); setErro(""); setMsg(""); }}
              style={{
                flex: 1,
                padding: "0.5rem",
                borderRadius: "7px",
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 600,
                transition: "all 0.2s",
                background: modo === m ? "#6366f1" : "transparent",
                color: modo === m ? "#fff" : "#6b7280",
              }}
            >
              {m === "login" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {modo === "cadastro" && (
            <div>
              <label style={{ display: "block", color: "#9ca3af", fontSize: "0.8rem", marginBottom: "0.4rem", fontWeight: 500 }}>
                Nome completo
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
                required
                style={inputStyle}
              />
            </div>
          )}

          <div>
            <label style={{ display: "block", color: "#9ca3af", fontSize: "0.8rem", marginBottom: "0.4rem", fontWeight: 500 }}>
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: "block", color: "#9ca3af", fontSize: "0.8rem", marginBottom: "0.4rem", fontWeight: 500 }}>
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              style={inputStyle}
            />
          </div>

          {erro && (
            <div style={{
              background: "#7f1d1d33",
              border: "1px solid #ef444433",
              borderRadius: "8px",
              padding: "0.75rem",
              color: "#fca5a5",
              fontSize: "0.875rem",
            }}>
              {erro}
            </div>
          )}

          {msg && (
            <div style={{
              background: "#14532d33",
              border: "1px solid #22c55e33",
              borderRadius: "8px",
              padding: "0.75rem",
              color: "#86efac",
              fontSize: "0.875rem",
            }}>
              {msg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? "#4338ca" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "0.875rem",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "0.5rem",
              opacity: loading ? 0.7 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {loading ? "Aguarde..." : modo === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#111",
  border: "1px solid #2a2a2a",
  borderRadius: "8px",
  padding: "0.75rem 1rem",
  color: "#fff",
  fontSize: "0.9375rem",
  outline: "none",
  boxSizing: "border-box",
};
