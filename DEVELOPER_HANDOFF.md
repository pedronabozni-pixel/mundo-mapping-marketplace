# Mapping Partners — Documentação Técnica

> Versão: maio/2026 · Última atualização: 27/05/2026 · Contato admin: pedronabozni@gmail.com

---

## 🎯 Visão Geral

**Mapping Partners** é um marketplace B2B de afiliados construído sobre a base de 16 mil creators validados da Mundo Mapping. Empresas cadastram produtos, definem comissões e aprovam creators que geram links rastreáveis. A plataforma cobre o ciclo completo: cadastro → aprovação → link → checkout → pagamento (Asaas) → comissão → saque.

**Status atual:** Em produção. Todas as funcionalidades core operacionais.
**URL de produção:** `https://mundo-mapping-marketplace-production.up.railway.app`

---

## ✅ Status Atual (27/05/2026)

| Módulo | Estado | Notas |
|---|---|---|
| **Landing Page premium** | ✅ Em produção | Dark mode, Inter + DM Mono, animações framer-motion (parallax, split-words, magnetic), 9 seções (hero, manifesto, métricas, como funciona, duas frentes, planos, CTA, footer) |
| **Autenticação** | ✅ Funcionando | Empresa, influenciador e admin separados por `user_type` + RLS |
| **Painel admin** | ✅ Funcionando | `getAdminSession()` + service role nas APIs; RLS via função `is_admin()` SECURITY DEFINER |
| **Wallet automático Asaas** | ✅ Funcionando | Criada no cadastro do influenciador (sem precisar de CNPJ prévio) |
| **83 nichos no cadastro** | ✅ Funcionando | Replicados da plataforma antiga em ordem alfabética |
| **Perfil empresa completo** | ✅ Funcionando | 6 seções (dados, endereço com ViaCEP, responsável, documentos, plano, segurança) |
| **Isolamento de dados** | ✅ Funcionando | RLS por `empresa_id` + redirect server-side por `user_type` |
| **Checkout cartão + PIX** | ✅ Funcionando | QR Code com polling a cada 3s, webhook Asaas |
| **Sistema de afiliação** | ✅ Funcionando | Links únicos, tracking de cliques (RPC SECURITY DEFINER), atribuição de venda |
| **Área de membros** | ✅ Funcionando | Módulos / aulas / materiais por produto digital |
| **Order bump + upsell** | ✅ Funcionando | Configurável por produto |
| **Cupons de desconto** | ✅ Funcionando | Validação server-side |

---

## 🏗️ Stack

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js (App Router) | 15.5.12 (runtime) — `^15.1.6` no `package.json` |
| UI | React | 19.0.0 |
| Linguagem | TypeScript | 5.x |
| Estilização | Tailwind CSS | 3.4.17 |
| Animações | Framer Motion | 12.39.0 |
| Auth + DB + Storage | Supabase (`@supabase/ssr` + `@supabase/supabase-js`) | 0.10.2 / 2.105.3 |
| Pagamentos | Asaas (cartão + PIX + assinatura recorrente) | — |
| Deploy | Railway (via **Dockerfile**) | — |
| Runtime | Node 20-alpine | — |

---

## 🔗 URLs

| Recurso | URL |
|---|---|
| **Produção** | `https://mundo-mapping-marketplace-production.up.railway.app` |
| **Landing Page** | `/mundo-mapping/partners` |
| **Login Empresa** | `/mundo-mapping/empresa/login` |
| **Login Influenciador** | `/mundo-mapping/influenciador/login` |
| **Login Admin** | `/mundo-mapping/admin/login` |
| **Painel Empresa** | `/mundo-mapping/afiliados/*` |
| **Painel Influenciador** | `/mundo-mapping/influenciadores/*` |
| **Painel Admin** | `/mundo-mapping/admin/*` |
| **Checkout público** | `/checkout/[slug]?ref=[codigo]` |
| **Tracker de link** | `/r/[codigo]` |
| **Área de membros** | `/membros/[produto]` |
| **GitHub** | `https://github.com/pedronabozni-pixel/marketplace` |

### Branches relevantes

- `main` — produção, deploy automático Railway
- `lp-antiga-backup` — snapshot da LP anterior antes da reescrita premium (rollback se necessário)

---

## 🔐 Variáveis de ambiente

Configuradas no **Railway dashboard** (idealmente como variáveis compartilhadas entre build e runtime).

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...                 # NUNCA expor no client

# Asaas
ASAAS_API_KEY=...
ASAAS_WEBHOOK_TOKEN=...

# App
NEXT_PUBLIC_APP_URL=https://mundo-mapping-marketplace-production.up.railway.app
```

### ⚠️ NEXT_PUBLIC_* precisa estar disponível em BUILD TIME

Variáveis `NEXT_PUBLIC_*` são **inlinadas pelo webpack durante `next build`**, não lidas em runtime no browser. Por isso o Dockerfile declara `ARG` + re-exporta como `ENV` antes do `RUN npm run build`. Se uma `NEXT_PUBLIC_*` for adicionada no Railway dashboard **após** o build, é necessário um Redeploy completo (não Restart) para ela aparecer no bundle.

Para evitar regressão do bug "Application error: a client-side exception" em `/assinar/*`:

- `src/lib/supabase/env.ts` lê com **chave literal** (`process.env.NEXT_PUBLIC_SUPABASE_URL`), nunca dinâmica (`process.env[key]`) — webpack só consegue inlinar chaves literais.
- `next.config.ts` declara o bloco `env: { NEXT_PUBLIC_SUPABASE_URL: ... }` como reforço.
- `Dockerfile` declara `ARG NEXT_PUBLIC_SUPABASE_URL` + `ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL` antes do build step.

---

## 🗄️ Banco de Dados (Supabase)

### Tabelas principais

| Tabela | Descrição | Isolamento |
|---|---|---|
| `profiles` | Perfil de todos os usuários | `id = auth.users.id` |
| `produtos` | Catálogo das empresas | `empresa_id` |
| `links_afiliados` | Links rastreáveis | `empresa_id`, `creator_id` |
| `pedidos_afiliacao` | Solicitações de afiliação | `empresa_id`, `creator_id` |
| `pedidos` | Pedidos de compra | `empresa_id` |
| `vendas` | Vendas confirmadas (comissões) | `empresa_id`, `creator_id` |
| `cupons` | Cupons por produto | `empresa_id` |
| `acessos_membros` | Acesso a produtos digitais | `user_id`, `produto_id` |
| `solicitacoes_saque` | Pedidos de saque | `creator_id` |
| `modulos` / `aulas` / `materiais` | Área de membros | `produto_id` |

### Schema: `profiles` (atual — pós-migração `20260520_profiles_empresa_fields`)

```sql
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id),
  email           TEXT,
  user_type       TEXT,                    -- 'empresa' | 'influenciador' | 'admin'
  full_name       TEXT,
  company_name    TEXT,
  cpf_cnpj        TEXT UNIQUE,
  phone           TEXT,
  niche           TEXT,                    -- creators: 1 dos 83 nichos
  -- Influenciador (redes sociais)
  instagram_handle TEXT,    instagram_followers INTEGER,
  tiktok_handle    TEXT,    tiktok_followers    INTEGER,
  youtube_handle   TEXT,    youtube_subscribers INTEGER,
  twitter_handle   TEXT,    twitter_followers   INTEGER,
  engagement_rate  NUMERIC,
  city  TEXT,  state TEXT,  bio TEXT,  avatar_url TEXT,
  -- Empresa (perfil completo)
  razao_social     TEXT,    segmento  TEXT,  receber_propostas TEXT,
  celular          TEXT,
  cep              TEXT,    endereco  TEXT,  numero      TEXT,
  complemento      TEXT,    estado    TEXT,  cidade      TEXT,  bairro TEXT,
  -- Responsável da empresa
  nome_responsavel  TEXT,   cargo_responsavel TEXT,
  rg_responsavel    TEXT,   cpf_responsavel   TEXT,
  data_nascimento   DATE,   email_responsavel TEXT,
  -- Documentação (URLs no Storage)
  cartao_cnpj_url           TEXT,
  comprovante_endereco_url  TEXT,
  doc_identificacao_url     TEXT,
  -- Wallet Asaas (creators)
  wallet_id        TEXT,
  -- Plano (empresas)
  plano                 TEXT DEFAULT 'associate',
  asaas_customer_id     TEXT,
  asaas_subscription_id TEXT,
  plano_status          TEXT,
  -- Status
  is_verified  BOOLEAN DEFAULT false,
  status       TEXT DEFAULT 'ativo',
  criado_em    TIMESTAMPTZ DEFAULT now()
);
```

### Função `is_admin()` — usada nas RLS policies

```sql
-- 20260521_fix_admin_rls_policy.sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_type = 'admin'
  )
$$;

-- Policy de profiles
CREATE POLICY "profiles select" ON public.profiles FOR SELECT TO authenticated
  USING (public.is_admin() OR id = auth.uid());
```

> **Por que SECURITY DEFINER:** evita recursão autorreferencial nas policies. Sem `SECURITY DEFINER`, a query dentro da policy de `profiles` chamaria a própria policy de `profiles` → loop infinito. A função roda com privilégio do owner e bypassa RLS apenas para o check de admin.

### Trigger `handle_new_user`

```sql
-- 20260519_handle_new_user_trigger.sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- handle_new_user() — SECURITY DEFINER, bypassa RLS
-- Insere em profiles com user_type do raw_user_meta_data (default: 'empresa')
-- EXCEPTION WHEN others THEN RETURN NEW — nunca bloqueia a criação do usuário
```

### RLS — `produtos` (resumo)

```sql
empresa_id = auth.uid()                                      -- empresa: CRUD próprio
status = 'published'                                         -- anon: ver published
status = 'published' AND visivel_shopping = true             -- influenciador: marketplace
  AND (SELECT user_type FROM profiles WHERE id = auth.uid()) = 'influenciador'
public.is_admin()                                            -- admin: vê tudo
```

### Migrations rodadas (em ordem)

```
20260513_produtos_schema_completo.sql
20260513_pedidos_afiliacao.sql
20260514_links_afiliados_anon_read.sql
20260514_rls_cancel_policies.sql
20260515_fix_url_produto_links_afiliados.sql
20260515_registrar_clique_anon_grant.sql
20260516_checkout_sistema.sql
20260517_area_membros.sql
20260518_cupons.sql
20260518_order_bump_upsell.sql
20260518_pix_confirm_policy.sql
20260518_webhook_vendas.sql
20260519_profiles_cpf_cnpj.sql
20260519_profiles_subscription.sql
20260519_solicitacoes_saque.sql
20260519_handle_new_user_trigger.sql        ← cria profile no signup
20260519_fix_rls_isolamento_produtos.sql
20260520_profiles_admin_policies.sql
20260520_profiles_empresa_fields.sql         ← campos perfil empresa completos
20260521_fix_admin_rls_policy.sql            ← função is_admin() SECURITY DEFINER
```

---

## 🔐 Autenticação & Permissões

### Tipos de usuário

| user_type | Acesso | Seção |
|---|---|---|
| `empresa` | Cadastra produtos, gerencia afiliados, financeiro próprio | `/mundo-mapping/afiliados/*` |
| `influenciador` | Marketplace, links, comissões | `/mundo-mapping/influenciadores/*` |
| `admin` | Visão global de tudo | `/mundo-mapping/admin/*` |

### Fluxo de cadastro

1. Form em `/mundo-mapping/{empresa|influenciador}/login`
2. `supabase.auth.signUp()` com `user_type` em `raw_user_meta_data`
3. Trigger `handle_new_user` cria `profiles`
4. CPF/CNPJ validado server-side via `/api/auth/check-cpf-cnpj` (service role bypassa RLS)
5. **Influenciador:** chamada extra a `/api/mundo-mapping/influenciadores/create-wallet` criando wallet Asaas automaticamente
6. Confirmação de e-mail (Supabase default) — sem sessão imediata até confirmar

### Isolamento por seção (server-side guard)

```typescript
// /mundo-mapping/afiliados/layout.tsx
const { data: profile } = await supabase
  .from("profiles").select("user_type").eq("id", user.id).maybeSingle();
if (profile?.user_type === "influenciador") redirect("/mundo-mapping/influenciador/login");

// /mundo-mapping/influenciadores/layout.tsx
if (profile?.user_type !== "influenciador") redirect("/mundo-mapping/empresa/login");
```

### Admin auth (`src/lib/admin-auth.ts`)

```typescript
export async function getAdminSession(): Promise<AdminSession | null> {
  // valida sessão + checa user_type === 'admin' via service role client
}

export async function requireAdmin(): Promise<string | null> {
  const s = await getAdminSession();
  return s?.userId ?? null;
}
```

APIs do painel admin (`/api/mundo-mapping/admin/*`) usam `createAdminClient()` (service role) após `requireAdmin()` para queries que bypassam RLS.

---

## 💳 Integração Asaas

### Endpoints utilizados

| Endpoint | Uso |
|---|---|
| `POST /customers` | Cria cliente Asaas no cadastro |
| `POST /payments` | Cobrança avulsa (cartão/PIX) |
| `GET /payments/{id}/pixQrCode` | Gera QR Code PIX |
| `GET /payments/{id}` | Polling status |
| `POST /subscriptions` | Assinatura recorrente (plano empresa) |
| `DELETE /subscriptions/{id}` | Cancela assinatura |
| `POST /wallets` | Wallet do creator (split — futuro) |

### Fluxo de checkout público

```
1. /checkout/[slug]?ref=[codigo_afiliado]
2. POST /api/checkout/payment
   → cria/busca customer
   → cria payment (cartão = imediato; PIX = QR Code)
   → INSERT pedidos (status: 'pendente')
3. PIX: frontend polling /api/checkout/pix-status a cada 3s
4. Webhook Asaas → /api/webhook/asaas
   → UPDATE pedido (status: 'pago')
   → INSERT vendas (rastreia creator_id e comissao)
   → INSERT acessos_membros (se digital)
   → UPDATE links_afiliados.vendas
```

### Webhook

- Endpoint: `/api/webhook/asaas`
- Validação: `x-asaas-access-token === process.env.ASAAS_WEBHOOK_TOKEN`
- Eventos: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_REFUNDED`, `PAYMENT_CHARGEBACK_REQUESTED`

### Assinaturas (planos de empresa)

| Plano | Mensalidade | Fee por venda (Asaas + extra) |
|---|---|---|
| `associate` | Grátis | + 2% |
| `partner` | R$ 117/mês | + R$ 0,99 |
| `elite` | R$ 197/mês | + R$ 0,49 |

Assinatura criada/cancelada em `/mundo-mapping/afiliados/perfil`. `asaas_subscription_id` armazenado em `profiles`.

---

## 🔗 Sistema de Afiliados

```
/r/[codigo]  →  RPC registrar_clique()  →  redirect url_produto
```

- `codigo`: 8 chars alfanuméricos (gerado client com `crypto.getRandomValues`, retry em 23505)
- `registrar_clique()` é RPC `SECURITY DEFINER` — acessível por anon
- Atribuição:
  - **Automática:** link gerado no clique "Me afiliar"
  - **Manual:** cria `pedidos_afiliacao` → empresa aprova → link criado

### Tracking

```sql
links_afiliados.cliques  -- via registrar_clique()
links_afiliados.vendas   -- via webhook /api/webhook/asaas
vendas.creator_id        -- comissão rastreável
vendas.valor / comissao  -- GMV e comissão calculada
```

### Cálculo de comissão (em `/api/checkout/payment`)

```typescript
if (comissao_tipo === "percent") comissao = preco * comissao_valor / 100;
if (comissao_tipo === "fixed")   comissao = comissao_valor;
// comissao_base 'gross' | 'net'
```

---

## 🎨 Landing Page premium (`/mundo-mapping/partners`)

Reescrita completa em maio/2026 — referência visual: `toptier.relats.com`.

- **Fontes:** Inter (300–900) + DM Mono (labels/eyebrows) via `next/font/google` no `partners/layout.tsx`
- **Animações:** Framer Motion — `useScroll`/`useTransform` (parallax), `SplitWords` (letter-by-letter), `Magnetic` (botões), counter animado, marquee infinito, custom cursor com `mix-blend-difference`
- **Tema:** dark mode #080808/#0a0a0a + acento `#ef0f1a` (vermelho Mapping M)
- **Seções:** Navbar → Hero → Marquee de métricas → Manifesto → Métricas → Como Funciona → Duas Frentes → Planos → CTA Final → Footer
- **Acessibilidade:** `prefers-reduced-motion` desliga marquee/blobs, `aria-hidden` em SVGs decorativos, `suppressHydrationWarning` nos elementos com motion-value style + initial-animate
- **SEO:** OpenGraph + Twitter Card + keywords no `partners/layout.tsx`

---

## 📦 Funcionalidades por área

### Empresa (`/afiliados/*`)
- [x] Cadastro/login com validação de CPF/CNPJ
- [x] Perfil completo (6 seções: dados, endereço com ViaCEP, responsável, documentos, plano, segurança)
- [x] Dashboard com métricas: produtos ativos, creators afiliados, comissão
- [x] CRUD de produtos (rascunho, publicado, pausado)
- [x] Checkout customizável (cor, headline, CTA, depoimentos, banner) com preview desktop/mobile
- [x] Aprovação manual/automática de afiliados
- [x] Relatório de campanhas (planos Partner/Elite)
- [x] Extrato financeiro de vendas
- [x] Área de membros: módulos, aulas, materiais
- [x] Order bump + upsell por produto
- [x] Cupons de desconto
- [x] Gestão de plano + assinatura recorrente Asaas

### Influenciador (`/influenciadores/*`)
- [x] Cadastro/login com 83 nichos + redes sociais (Instagram, TikTok, YouTube, Twitter)
- [x] Wallet Asaas criada automaticamente no cadastro
- [x] Marketplace de produtos para afiliação
- [x] Geração/cópia de link único
- [x] Extrato de links ativos e cliques
- [x] Histórico de comissões e vendas
- [x] Solicitação de saque

### Admin (`/admin/*`)
- [x] Dashboard global (stats: influenciadores, empresas, saques, produtos)
- [x] Aprovação/rejeição de influenciadores
- [x] Gestão de planos de empresa
- [x] Processamento de saques
- [x] Service role em todas as APIs (`requireAdmin()` + `createAdminClient()`)

### Checkout público (`/checkout/[slug]`)
- [x] Pagamento cartão de crédito
- [x] Pagamento PIX (QR Code + polling)
- [x] Atribuição via `?ref=[codigo]`
- [x] Página de obrigado

---

## ⚠️ Pendências conhecidas

| Pendência | Detalhe | Prioridade |
|---|---|---|
| **Split de pagamento Asaas** | Hoje a venda inteira entra para a empresa; comissão é repassada manualmente via solicitação de saque. Implementar split nativo do Asaas usando `wallet_id` do creator. | 🔴 Alta |
| **E-mail transacional (Resend)** | Supabase manda só confirmação de e-mail. Sem boas-vindas, aprovação de afiliado, notificação de venda, recibo. Integrar Resend ou similar. | 🟡 Média |
| **Domínio próprio** | Subdomínio `*.up.railway.app` em produção. Apontar `mappingpartners.com.br` no Railway e atualizar `NEXT_PUBLIC_APP_URL` + URL do webhook Asaas. | 🟡 Média |
| **Recuperação de carrinho abandonado** | Pedidos em `status: 'pendente'` ficam sem follow-up. Job/cron + e-mail. | 🟡 Média |
| **Rate limiting** | Sem proteção nas APIs públicas (`/api/auth/check-cpf-cnpj`, `/api/checkout/*`). Adicionar middleware (Upstash Ratelimit ou similar). | 🟡 Média |
| **Health score de creators** | Campos `score_minimo`, `whitelist_only`, `exige_social_proof` existem mas não são usados ativamente. | 🟢 Baixa |
| **Antifraude** | Chargebacks são registrados mas sem bloqueio automático. | 🟢 Baixa |
| **Notificações push em tempo real** | Existe canal Supabase Realtime no relatório, mas sem push para aprovações/vendas. | 🟢 Baixa |
| **Exportação CSV/Excel** | Sem download de extrato financeiro ou relatório de creators. | 🟢 Baixa |
| **i18n** | Interface 100% PT-BR. | 🟢 Baixa |

---

## 🚀 Deploy

### Build no Railway

O projeto usa **Dockerfile** (não Nixpacks). Configurado em `railway.toml`:

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"
```

O `Dockerfile` declara `ARG` para as variáveis `NEXT_PUBLIC_*` e re-exporta como `ENV` antes do `RUN npm run build` — essencial para o webpack inlinar os valores no bundle do client. Sem isso, `createBrowserClient("", "")` lança `supabaseUrl is required.`

```dockerfile
FROM node:20-alpine
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Push em `main` → Railway rebuilda automaticamente. Mudar env var no dashboard requer **Redeploy** (não Restart) para reentrar no bundle.

### Rodar localmente

```bash
git clone https://github.com/pedronabozni-pixel/marketplace.git
cd marketplace
npm install

# Criar .env.local com:
# NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# SUPABASE_SERVICE_ROLE_KEY=eyJ...
# ASAAS_API_KEY=...
# ASAAS_WEBHOOK_TOKEN=...
# NEXT_PUBLIC_APP_URL=http://localhost:3000

npm run dev   # localhost:3000
```

### Rodar migrations no Supabase

Executar os SQLs de `/supabase/migrations/` em ordem cronológica no SQL Editor do Supabase Dashboard.

---

## 🏦 Modelo de negócio

- **Empresa:** paga plano recorrente Asaas para anunciar (Associate grátis / Partner R$117 / Elite R$197 por mês)
- **Influenciador:** recebe comissão por venda gerada via seu link
- **Plataforma:** rastreia, registra e cobra fee por venda (Asaas + adicional conforme plano da empresa)
- Repasse para creators: **manual** (via `solicitacoes_saque` → admin processa)
- Não há split automático no Asaas (ver pendência)

---

## 📞 Contato

| Pessoa | E-mail | Papel |
|---|---|---|
| Pedro Nabozni | pedronabozni@gmail.com | Dono do projeto, admin do Railway/Supabase/Asaas |
| Daniel | Daniel@mapa360.com.br | Avaliação backend / integração |

---

*Documento atualizado em 27/05/2026. Para atualizações, contatar pedronabozni@gmail.com.*
