"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Tab = "entrar" | "cadastrar";

const NICHO_OPTIONS = [
  "60+", "Afro", "Agronegócio", "Animais De Estimação", "Arquitetura",
  "Arte E Cultura", "Artesanato", "Atletas", "Autismo", "Automóveis",
  "Bebidas", "Beleza", "Cabelo", "Carreira", "Cartão De Milhas",
  "Casa", "Casamento", "Causas E ONGs", "Construção", "Crianças",
  "Cripto", "Cultura Geek", "Cyber Atletas", "Dança", "Decoração",
  "Direito", "Economia", "Educação", "Empreendedorismo", "Entretenimento",
  "Espiritualidade", "Esportes", "ESG", "Estética", "Estilo De Vida",
  "Família", "Filmes E Séries", "Finanças", "Finanças Pessoais", "Fitness",
  "Fotografia", "Futebol", "Games", "Gastronomia", "Gravidez",
  "Humor", "Imóveis", "Industrial", "Inteligência Artificial", "Jogos",
  "LGBTQI+", "Livros", "Luxo", "Manicure", "Maquiagem",
  "Marketing", "Marketing Pessoal", "Maternidade", "Médico", "Moda",
  "Motivacional", "Música", "Negócios Empresariais", "Nutrição", "Paternidade",
  "Política", "Psicologia", "Saúde", "Seguro/Seguradora", "Sexualidade",
  "Síndrome De Down", "Startup", "Streamer", "Sustentabilidade", "Tatuagem",
  "TDAH", "Tecnologia", "Vegano", "Vendas", "Vestibular",
  "Viagens", "Vida Saudável", "Vinhos",
];

const inputCls =
  "w-full bg-transparent border-b border-white/10 py-3 text-[15px] text-white placeholder:text-[#333] focus:outline-none focus:border-[#C8102E] transition-colors";

const PLATFORMS = [
  { platform: "Instagram", handleName: "instagram_handle", followersName: "instagram_followers", followerLabel: "Seguidores" },
  { platform: "TikTok",    handleName: "tiktok_handle",    followersName: "tiktok_followers",    followerLabel: "Seguidores" },
  { platform: "YouTube",   handleName: "youtube_handle",   followersName: "youtube_subscribers", followerLabel: "Inscritos"  },
  { platform: "Twitter / X", handleName: "twitter_handle", followersName: "twitter_followers",  followerLabel: "Seguidores" },
] as const;

export default function InfluenciadorLoginPage() {
  const [tab, setTab] = useState<Tab>("entrar");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);
  const [hasAsaasAccount, setHasAsaasAccount] = useState(false);

  function reset() {
    setError(null);
    setInfo(null);
    setForgot(false);
  }

  function switchTab(t: Tab) {
    setTab(t);
    reset();
  }

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      const supabase = createClient();
      const fd = new FormData(e.currentTarget);
      const { error } = await supabase.auth.signInWithPassword({
        email: fd.get("email") as string,
        password: fd.get("password") as string,
      });
      if (error) setError("E-mail ou senha incorretos.");
      else window.location.href = "/mundo-mapping/influenciadores";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      const supabase = createClient();
      const fd = new FormData(e.currentTarget);
      const password = fd.get("password") as string;
      const confirm = fd.get("confirm") as string;
      if (password !== confirm) {
        setError("As senhas não coincidem.");
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email: fd.get("email") as string,
        password,
        options: {
          data: {
            user_type: "influenciador",
            full_name: fd.get("full_name") as string,
          },
          emailRedirectTo: `${window.location.origin}/mundo-mapping/influenciador/dashboard`,
        },
      });
      if (error) {
        if (error.message?.includes("already registered") || error.message?.includes("User already registered")) {
          setError("__duplicate_email__");
        } else if (error.message?.toLowerCase().includes("invalid login") || error.message?.toLowerCase().includes("invalid credentials")) {
          setError("E-mail ou senha incorretos.");
        } else {
          console.error("[auth_error]", error.message);
          setError("Não foi possível concluir a operação. Tente novamente em instantes.");
        }
      } else if (data.user && (data.user.identities?.length ?? 1) === 0) {
        setError("__duplicate_email__");
      } else if (data.user) {
        const rawWalletId = (fd.get("wallet_id") as string | null)?.trim() || null;
        const num = (name: string) => { const v = parseInt(fd.get(name) as string); return isNaN(v) ? null : v; };
        const str = (name: string) => (fd.get(name) as string | null)?.trim() || null;
        await fetch("/api/mundo-mapping/save-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: data.user.id,
            profile: {
              email: fd.get("email") as string,
              user_type: "influenciador",
              full_name: str("full_name"),
              cpf_cnpj: str("cpf_cnpj"),
              phone: str("phone"),
              instagram_handle: str("instagram_handle"),
              instagram_followers: num("instagram_followers"),
              tiktok_handle: str("tiktok_handle"),
              tiktok_followers: num("tiktok_followers"),
              youtube_handle: str("youtube_handle"),
              youtube_subscribers: num("youtube_subscribers"),
              twitter_handle: str("twitter_handle"),
              twitter_followers: num("twitter_followers"),
              niche: str("niche"),
              ...(rawWalletId ? { wallet_id: rawWalletId } : {}),
            },
          }),
        });

        if (data.session) {
          // Cria wallet Asaas automaticamente se não informou manualmente
          if (!rawWalletId) {
            try {
              await fetch("/api/mundo-mapping/influenciadores/create-wallet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ access_token: data.session.access_token }),
              });
            } catch {
              // Falha silenciosa
            }
          }
          window.location.href = "/mundo-mapping/influenciadores";
        } else {
          setInfo("Conta criada! Verifique seu e-mail para confirmar antes de entrar.");
          setTab("entrar");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      const supabase = createClient();
      const fd = new FormData(e.currentTarget);
      const { error } = await supabase.auth.resetPasswordForEmail(
        fd.get("email") as string,
        { redirectTo: `${window.location.origin}/mundo-mapping/influenciador/login` }
      );
      if (error) setError(error.message);
      else setInfo("E-mail de recuperação enviado. Verifique sua caixa de entrada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center px-8 py-16"
      style={{ background: "#0a0a0a" }}
    >
      {/* Radial gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at top, rgba(200,16,46,0.06) 0%, transparent 60%)" }}
      />

      <div className="relative z-10 w-full" style={{ maxWidth: 420 }}>
        {/* Seal */}
        <p
          className="text-center uppercase text-[11px]"
          style={{ letterSpacing: "0.16em", color: "#888" }}
        >
          MAPPING <span style={{ color: "#C8102E" }}>·</span> PARTNERS
        </p>

        {/* Title */}
        <h1 className="mt-3 text-center font-serif text-[32px] font-normal leading-tight text-white">
          {tab === "cadastrar" ? "Criar conta" : "Bem-vindo"}
        </h1>

        {/* Subtitle */}
        <p className="mt-2 text-center text-[14px]" style={{ color: "#888" }}>
          Acesse a área do creator
        </p>

        {/* Tabs */}
        <div
          className="mt-10 flex"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          {(["entrar", "cadastrar"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchTab(t)}
              className="flex-1 text-[14px] font-medium bg-transparent transition-colors"
              style={{
                padding: "12px 4px",
                color: tab === t ? "#fff" : "#666",
                borderBottom: tab === t ? "2px solid #C8102E" : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {t === "entrar" ? "Entrar" : "Cadastrar"}
            </button>
          ))}
        </div>

        {/* Form area */}
        <div className="mt-8">
          {/* Error */}
          {error && (
            <div
              className="mb-5 rounded-lg px-[14px] py-3 text-[13px] leading-relaxed"
              style={{
                background: "rgba(200,16,46,0.08)",
                border: "1px solid rgba(200,16,46,0.2)",
                color: "#FF6B6B",
              }}
            >
              {error === "__duplicate_email__" ? (
                <>
                  Este e-mail já está cadastrado.{" "}
                  <button
                    className="font-semibold underline underline-offset-2"
                    onClick={() => switchTab("entrar")}
                    type="button"
                  >
                    Fazer login
                  </button>{" "}
                  ou use outro e-mail.
                </>
              ) : (
                error
              )}
            </div>
          )}

          {/* Info / success */}
          {info && (
            <div
              className="mb-5 rounded-lg px-[14px] py-3 text-[13px] leading-relaxed"
              style={{
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.2)",
                color: "#4ADE80",
              }}
            >
              {info}
            </div>
          )}

          {/* Sign in */}
          {tab === "entrar" && !forgot && (
            <form className="space-y-7" onSubmit={handleSignIn}>
              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: "#888" }}>
                  E-mail
                </label>
                <input
                  className={inputCls}
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[12px] font-medium" style={{ color: "#888" }}>
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgot(true)}
                    className="text-[12px] transition-colors hover:text-white"
                    style={{ color: "#666" }}
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <input
                  className={inputCls}
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                className="w-full rounded-lg bg-[#C8102E] hover:bg-[#A30D24] text-[14px] font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ padding: "14px" }}
                disabled={loading}
                type="submit"
              >
                {loading ? "Entrando…" : <span>Entrar <span className="opacity-70">→</span></span>}
              </button>
            </form>
          )}

          {/* Forgot password */}
          {tab === "entrar" && forgot && (
            <form className="space-y-7" onSubmit={handleForgot}>
              <p className="text-[14px] leading-relaxed" style={{ color: "#888" }}>
                Digite seu e-mail e enviaremos um link para redefinir sua senha.
              </p>

              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: "#888" }}>
                  E-mail
                </label>
                <input
                  className={inputCls}
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <button
                className="w-full rounded-lg bg-[#C8102E] hover:bg-[#A30D24] text-[14px] font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ padding: "14px" }}
                disabled={loading}
                type="submit"
              >
                {loading ? "Enviando…" : <span>Enviar link <span className="opacity-70">→</span></span>}
              </button>

              <button
                type="button"
                onClick={() => setForgot(false)}
                className="w-full text-center text-[13px] transition-colors hover:text-white"
                style={{ color: "#666" }}
              >
                ← Voltar para o login
              </button>
            </form>
          )}

          {/* Sign up */}
          {tab === "cadastrar" && (
            <form className="space-y-7" onSubmit={handleSignUp}>
              {/* Dados básicos */}
              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: "#888" }}>
                  Nome completo
                </label>
                <input className={inputCls} name="full_name" placeholder="Seu nome" required />
              </div>

              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: "#888" }}>
                  E-mail
                </label>
                <input
                  className={inputCls}
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: "#888" }}>
                  Senha
                </label>
                <input
                  className={inputCls}
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: "#888" }}>
                  Confirmar senha
                </label>
                <input
                  className={inputCls}
                  name="confirm"
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* CPF + Celular */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[12px] font-medium mb-2" style={{ color: "#888" }}>
                    CPF / CNPJ
                  </label>
                  <input
                    className={inputCls}
                    name="cpf_cnpj"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium mb-2" style={{ color: "#888" }}>
                    Celular
                  </label>
                  <input
                    className={inputCls}
                    name="phone"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              {/* Redes sociais */}
              <div
                className="pt-6"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p
                  className="text-[11px] uppercase mb-5"
                  style={{ letterSpacing: "0.12em", color: "#555" }}
                >
                  Redes sociais{" "}
                  <span style={{ color: "#444", textTransform: "none", letterSpacing: 0 }}>
                    (opcional)
                  </span>
                </p>

                <div className="space-y-6">
                  {PLATFORMS.map(({ platform, handleName, followersName, followerLabel }) => (
                    <div className="grid grid-cols-[1fr_96px] gap-4" key={platform}>
                      <div>
                        <label
                          className="block text-[11px] font-medium mb-2 uppercase"
                          style={{ letterSpacing: "0.08em", color: "#555" }}
                        >
                          {platform}
                        </label>
                        <div className="flex items-center border-b border-white/10 focus-within:border-[#C8102E] py-3 transition-colors gap-1">
                          <span className="text-[13px] select-none" style={{ color: "#444" }}>@</span>
                          <input
                            className="flex-1 bg-transparent text-[15px] text-white placeholder:text-[#333] focus:outline-none"
                            name={handleName}
                            placeholder="seuhandle"
                            type="text"
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          className="block text-[11px] font-medium mb-2 uppercase"
                          style={{ letterSpacing: "0.08em", color: "#555" }}
                        >
                          {followerLabel}
                        </label>
                        <input
                          className={inputCls}
                          min="0"
                          name={followersName}
                          placeholder="0"
                          type="number"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Nicho */}
                <div className="mt-6">
                  <label
                    className="block text-[11px] font-medium mb-2 uppercase"
                    style={{ letterSpacing: "0.08em", color: "#555" }}
                  >
                    Nicho principal
                  </label>
                  <select
                    className="w-full border-b border-white/10 py-3 text-[15px] text-white focus:outline-none focus:border-[#C8102E] transition-colors"
                    style={{ background: "#0a0a0a" }}
                    name="niche"
                  >
                    <option value="" style={{ background: "#0a0a0a" }}>
                      Selecione…
                    </option>
                    {NICHO_OPTIONS.map((n) => (
                      <option key={n} value={n} style={{ background: "#0a0a0a" }}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Asaas wallet */}
              <div
                className="pt-6"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    checked={hasAsaasAccount}
                    className="h-4 w-4 accent-[#C8102E]"
                    onChange={(e) => setHasAsaasAccount(e.target.checked)}
                    type="checkbox"
                  />
                  <span className="text-[14px] text-white">Já tenho conta Asaas</span>
                </label>

                {hasAsaasAccount && (
                  <div className="mt-5">
                    <input
                      className={inputCls}
                      name="wallet_id"
                      placeholder="ex: wal_xxxxxxxxxxxxxxxx"
                      type="text"
                    />
                    <p className="mt-2 text-[12px] leading-5" style={{ color: "#555" }}>
                      Cole aqui o ID da sua carteira Asaas para receber comissões automaticamente.
                    </p>
                  </div>
                )}
              </div>

              <button
                className="w-full rounded-lg bg-[#C8102E] hover:bg-[#A30D24] text-[14px] font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ padding: "14px" }}
                disabled={loading}
                type="submit"
              >
                {loading ? "Criando conta…" : <span>Criar conta <span className="opacity-70">→</span></span>}
              </button>

              <p className="text-center text-[11px]" style={{ color: "#666" }}>
                Ao cadastrar, você concorda com os{" "}
                <span className="font-medium" style={{ color: "#888" }}>
                  Termos de Uso
                </span>
              </p>
            </form>
          )}
        </div>

        {/* Cross link */}
        <p className="mt-8 text-center text-[13px]" style={{ color: "#666" }}>
          É empresa?{" "}
          <Link href="/mundo-mapping/empresa/login" className="font-medium text-white">
            Acesse aqui
          </Link>
        </p>

        {/* Footer */}
        <p
          className="mt-20 text-center text-[11px]"
          style={{ letterSpacing: "0.05em", color: "#444" }}
        >
          Sub-marca da Mundo Mapping
        </p>
      </div>
    </div>
  );
}
