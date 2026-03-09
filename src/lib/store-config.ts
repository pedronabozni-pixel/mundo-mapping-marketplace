export const STORE_NAME = "Genesis Distribuidora";

export const ADMIN_CONFIG = {
  // Senha de acesso ao painel /loja/admin. Troque em producao por variavel de ambiente.
  password: process.env.STORE_ADMIN_PASSWORD ?? "Genesis@123",
  // Token de sessao simples para proteger rotas admin via cookie.
  sessionToken: process.env.STORE_ADMIN_SESSION_TOKEN ?? "genesis-admin-session-ok"
};

export const ADMIN_COOKIE_NAME = "genesis_admin_session";
