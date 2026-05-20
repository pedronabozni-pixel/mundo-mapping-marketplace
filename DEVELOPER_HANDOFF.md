# Mapping Partners — Documentação Técnica

> Versão: maio/2026 · Contato admin: pedronabozni@gmail.com

---

## 🎯 Visão Geral

**Mapping Partners** é um marketplace B2B de afiliados construído sobre a base de 16 mil creators validados da Mundo Mapping. Empresas e produtores cadastram produtos, definem comissões e aprovam influenciadores que geram links rastreáveis de venda. A plataforma cobre o ciclo completo: cadastro → aprovação → link → checkout → pagamento → comissão → saque.

**Status atual:** Em produção. Funcionalidades core implementadas e operacionais. Pendências listadas na seção ⚠️.

**URL de produção:** `https://mundo-mapping-marketplace-production.up.railway.app`

---

## 🏗️ Arquitetura

### Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript |
| Estilização | Tailwind CSS |
| Banco de dados | Supabase (PostgreSQL + Auth + Storage) |
| Deploy | Railway |
| Pagamentos | Asaas (cartão de crédito + PIX) |
| Runtime | Node.js |

### Estrutura de pastas relevante

```
src/
├── app/
│   ├── mundo-mapping/
│   │   ├── afiliados/          # Área da empresa/produtor
│   │   │   ├── layout.tsx      # Auth: user_type = empresa|admin
│   │   │   ├── page.tsx        # Dashboard principal
│   │   │   ├── produtos/       # CRUD de produtos
│   │   │   ├── solicitacoes/   # Aprovação de afiliados
│   │   │   ├── creators/       # Gestão de links de creators
│   │   │   ├── financeiro/     # Extrato de vendas
│   │   │   └── relatorio/      # Métricas de campanha
│   │   ├── influenciadores/    # Área do creator/influenciador
│   │   │   ├── layout.tsx      # Auth: user_type = influenciador|admin
│   │   │   ├── shopping/       # Marketplace de produtos para afiliar
│   │   │   ├── meus-links/     # Links ativos do creator
│   │   │   └── financeiro/     # Extrato de comissões
│   │   ├── admin/              # Painel admin global
│   │   │   ├── influenciadores/
│   │   │   ├── empresas/
│   │   │   ├── saques/
│   │   │   └── produtos/
│   │   ├── empresa/login/      # Login/cadastro de empresa
│   │   └── influenciador/login/ # Login/cadastro de influenciador
│   ├── checkout/
│   │   └── [slug]/             # Checkout público (cartão + PIX)
│   ├── r/
│   │   └── [codigo]/           # Redirect de link de afiliado (tracking)
│   ├── membros/
│   │   └── [produto]/          # Área de membros (produtos digitais)
│   └── api/
│       ├── checkout/
│       │   ├── payment/        # Processa pagamento via Asaas
│       │   └── pix-status/     # Polling de status PIX
│       ├── webhook/
│       │   └── asaas/          # Webhook de confirmação de pagamento
│       ├── mundo-mapping/
│       │   └── admin/          # APIs do painel admin (server-side, service role)
│       │       ├── stats/
│       │       ├── influenciadores/
│       │       ├── empresas/
│       │       ├── saques/
│       │       ├── produtos/
│       │       └── profiles/[id]/
│       ├── auth/
│       │   └── check-cpf-cnpj/ # Valida CPF/CNPJ duplicado no cadastro
│       └── membros/
│           └── acesso/         # Verifica acesso a produto digital
├── components/mundo-mapping/
│   ├── product-store.tsx       # Context/state global de produtos (empresa)
│   ├── affiliate-ui.tsx        # Componentes e navegação da área empresa
│   ├── affiliate-frame.tsx     # Layout wrapper empresa (ProductStoreProvider)
│   ├── influencer-frame.tsx    # Layout wrapper influenciador
│   ├── influencer-marketplace.tsx # Marketplace de afiliação
│   └── checkout-editor.tsx     # Editor de checkout com preview desktop/mobile
└── lib/
    ├── supabase/
    │   ├── client.ts           # Client-side Supabase (anon key)
    │   ├── server.ts           # Server-side Supabase (session via cookies)
    │   └── admin.ts            # Admin client (service role key, server only)
    └── admin-auth.ts           # Helper requireAdmin() para API routes
```

### Fluxo de dados

```
[Empresa cadastra produto]
  → produtos (empresa_id = auth.uid())
  → visivel_shopping = true → aparece no marketplace de influenciadores

[Influenciador solicita afiliação]
  → pedidos_afiliacao (creator_id, produto_id, empresa_id)
  → aprovacao_modo = "automatic" → link gerado imediatamente
  → aprovacao_modo = "manual" → empresa aprova em /afiliados/solicitacoes
  → links_afiliados (codigo único, creator_id, produto_id)

[Cliente clica no link]
  → /r/[codigo] → RPC registrar_clique() → redirect para checkout
  → links_afiliados.cliques++

[Cliente faz checkout]
  → /checkout/[slug]?ref=[codigo]
  → /api/checkout/payment → Asaas API
  → pedidos (status: pendente → pago)
  → acessos_membros (se produto digital)

[Pagamento confirmado]
  → Webhook Asaas → /api/webhook/asaas
  → vendas (empresa_id, creator_id, comissao)
  → links_afiliados.vendas++

[Creator solicita saque]
  → solicitacoes_saque
  → Admin processa manualmente
```

---

## 🔗 Acessos

| Recurso | URL / Info |
|---|---|
| **Produção** | `https://mundo-mapping-marketplace-production.up.railway.app` |
| **GitHub** | `https://github.com/pedronabozni-pixel/mundo-mapping-marketplace` |
| **Supabase** | Dashboard do projeto (solicitar acesso ao admin) |
| **Railway** | Deploy automático a cada push em `main` |
| **Asaas** | Conta em produção (solicitar credenciais ao admin) |

### Variáveis de ambiente (Railway)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # Nunca expor no client — apenas server/API routes

# Asaas
ASAAS_API_KEY=                     # Chave de produção
ASAAS_WEBHOOK_TOKEN=               # Token de validação do webhook

# App
NEXT_PUBLIC_APP_URL=https://mundo-mapping-marketplace-production.up.railway.app
```

> **Atenção:** `SUPABASE_SERVICE_ROLE_KEY` sem prefixo `NEXT_PUBLIC_` — nunca chega ao browser. Usado exclusivamente em route handlers do painel admin e no admin client.

---

## 🗄️ Banco de Dados (Supabase)

### Tabelas principais

| Tabela | Descrição | Chave principal de isolamento |
|---|---|---|
| `profiles` | Perfil de todos os usuários | `id` = `auth.users.id` |
| `produtos` | Catálogo de produtos das empresas | `empresa_id` |
| `links_afiliados` | Links rastreáveis de afiliados | `empresa_id`, `creator_id` |
| `pedidos_afiliacao` | Solicitações de afiliação | `empresa_id`, `creator_id` |
| `pedidos` | Pedidos de compra | `empresa_id` |
| `vendas` | Registro de vendas confirmadas | `empresa_id`, `creator_id` |
| `cupons` | Cupons de desconto por produto | `empresa_id` |
| `acessos_membros` | Acesso de compradores a produtos digitais | `user_id`, `produto_id` |
| `solicitacoes_saque` | Pedidos de saque de creators | `creator_id` |
| `modulos` / `aulas` / `materiais` | Conteúdo da área de membros | `produto_id` |

### Schema: `produtos` (principal)

```sql
CREATE TABLE public.produtos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                TEXT NOT NULL UNIQUE,
  empresa_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_nome        TEXT,
  nome                TEXT NOT NULL,
  categoria           TEXT,
  descricao           TEXT,
  url_produto         TEXT,
  preco               NUMERIC(10,2) NOT NULL,
  comissao_tipo       TEXT DEFAULT 'percent',   -- 'percent' | 'fixed'
  comissao_valor      NUMERIC(10,2) DEFAULT 20,
  comissao_base       TEXT DEFAULT 'gross',     -- 'gross' | 'net'
  aprovacao_modo      TEXT DEFAULT 'manual',    -- 'manual' | 'automatic'
  visivel_shopping    BOOLEAN DEFAULT false,
  status              TEXT DEFAULT 'draft',     -- 'draft' | 'published' | 'paused'
  garantia_dias       INTEGER DEFAULT 14,
  liberacao_dias      INTEGER DEFAULT 14,
  tipo_entregavel     TEXT DEFAULT 'digital',   -- 'digital' | 'fisico' | 'evento' | 'servico'
  -- checkout customizável
  checkout_cor        TEXT DEFAULT '#dc2626',
  checkout_cor_fundo  TEXT DEFAULT '#ffffff',
  checkout_headline   TEXT,
  checkout_cta        TEXT DEFAULT 'Comprar agora',
  checkout_depoimentos JSONB,
  -- order bump / upsell
  order_bump_ativo    BOOLEAN DEFAULT false,
  order_bump_produto_id UUID,
  upsell_ativo        BOOLEAN DEFAULT false,
  upsell_produto_id   UUID,
  criado_em           TIMESTAMPTZ DEFAULT now(),
  atualizado_em       TIMESTAMPTZ DEFAULT now()
);
```

### Schema: `profiles`

```sql
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id),
  email           TEXT,
  user_type       TEXT,        -- 'empresa' | 'influenciador' | 'admin'
  full_name       TEXT,
  company_name    TEXT,
  cpf_cnpj        TEXT UNIQUE,
  instagram_handle TEXT,
  plano           TEXT DEFAULT 'associate',  -- 'associate' | 'partner' | 'elite'
  status          TEXT DEFAULT 'ativo',
  -- assinatura Asaas
  asaas_customer_id     TEXT,
  asaas_subscription_id TEXT,
  plano_status          TEXT,
  criado_em       TIMESTAMPTZ DEFAULT now()
);
```

### RLS Policies — `produtos`

```sql
-- Empresa vê e gerencia apenas seus próprios produtos
CREATE POLICY "empresa pode ver seus produtos"       FOR SELECT TO authenticated USING (empresa_id = auth.uid());
CREATE POLICY "empresa pode criar produto"           FOR INSERT TO authenticated WITH CHECK (empresa_id = auth.uid());
CREATE POLICY "empresa pode editar produto"          FOR UPDATE TO authenticated USING (empresa_id = auth.uid());
CREATE POLICY "empresa pode deletar produto"         FOR DELETE TO authenticated USING (empresa_id = auth.uid());

-- Anon vê produtos publicados (checkout público)
CREATE POLICY "produtos publicados anon"             FOR SELECT TO anon USING (status = 'published');

-- Influenciador vê marketplace (published + visivel_shopping)
CREATE POLICY "influenciador pode ver shopping"      FOR SELECT TO authenticated
  USING (
    status = 'published' AND visivel_shopping = true
    AND (SELECT user_type FROM profiles WHERE id = auth.uid()) = 'influenciador'
  );

-- Admin vê tudo
CREATE POLICY "admin pode ver todos os produtos"     FOR SELECT TO authenticated
  USING ((SELECT user_type FROM profiles WHERE id = auth.uid()) = 'admin');
```

### Triggers ativos

```sql
-- Cria perfil automaticamente ao criar usuário em auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- handle_new_user() — SECURITY DEFINER, bypassa RLS
-- Insere em profiles com user_type do raw_user_meta_data (padrão: 'empresa')
-- EXCEPTION WHEN others THEN RETURN NEW — nunca bloqueia criação do usuário
```

### Função RPC

```sql
-- Incrementa cliques atomicamente (chamado por /r/[codigo], acessível por anon)
CREATE FUNCTION public.registrar_clique(p_codigo TEXT)
  RETURNS void LANGUAGE plpgsql SECURITY DEFINER ...
```

---

## 🔐 Autenticação & Permissões

### Tipos de usuário

| user_type | Acesso | Seção |
|---|---|---|
| `empresa` | Cadastra produtos, gerencia afiliados, vê financeiro próprio | `/mundo-mapping/afiliados/*` |
| `influenciador` | Navega marketplace, gera links, vê comissões | `/mundo-mapping/influenciadores/*` |
| `admin` | Visão global de todos os dados | `/mundo-mapping/admin/*` + ambas as seções |

### Fluxo de cadastro

1. Usuário preenche formulário em `/mundo-mapping/empresa/login` ou `/influenciador/login`
2. `supabase.auth.signUp()` com `user_type`, `full_name`, `company_name` em `raw_user_meta_data`
3. Trigger `handle_new_user` cria `profiles` automaticamente
4. Com confirmação de e-mail ativa: usuário recebe e-mail e confirma; sem sessão imediata
5. CPF/CNPJ é validado antes do cadastro via `/api/auth/check-cpf-cnpj` (usa service role para evitar RLS)

### Isolamento por seção

Os layouts são **server components assíncronos** que verificam `user_type` antes de renderizar:

```typescript
// /mundo-mapping/afiliados/layout.tsx
const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", user.id).maybeSingle();
if (profile?.user_type === "influenciador") redirect("/mundo-mapping/influenciador/login");

// /mundo-mapping/influenciadores/layout.tsx
if (!profile?.user_type || profile.user_type !== "influenciador") redirect("/mundo-mapping/empresa/login");
```

### Admin auth

```typescript
// src/lib/admin-auth.ts
export async function requireAdmin(): Promise<string | null> {
  const user = await getServerUser();
  const profile = await adminClient.from("profiles").select("user_type").eq("id", user.id).single();
  return profile?.user_type === "admin" ? user.id : null;
}
```

---

## 💳 Integração Asaas

### Endpoints utilizados

| Endpoint Asaas | Uso |
|---|---|
| `POST /customers` | Cria cliente Asaas no cadastro |
| `POST /payments` | Gera cobrança (cartão ou PIX) |
| `GET /payments/{id}/pixQrCode` | Gera QR Code PIX |
| `GET /payments/{id}` | Polling status pagamento |
| `POST /subscriptions` | Cria assinatura recorrente (planos) |
| `DELETE /subscriptions/{id}` | Cancela assinatura |

### Fluxo de checkout

```
1. Cliente acessa /checkout/[slug]?ref=[codigo_afiliado]
2. Preenche dados pessoais + forma de pagamento
3. POST /api/checkout/payment:
   - Cria/busca customer no Asaas
   - Cria payment (cartão: processamento imediato; PIX: gera QR Code)
   - Insere pedido em public.pedidos (status: 'pendente')
4. PIX: frontend faz polling em /api/checkout/pix-status a cada 3s
5. Webhook Asaas confirma pagamento → /api/webhook/asaas:
   - Atualiza pedido (status: 'pago')
   - Insere em public.vendas (rastreia comissão por creator_id)
   - Insere em public.acessos_membros (se produto digital)
   - Incrementa links_afiliados.vendas
```

### Webhook

```
Endpoint: /api/webhook/asaas
Validação: header x-asaas-access-token === process.env.ASAAS_WEBHOOK_TOKEN
Eventos tratados:
  - PAYMENT_CONFIRMED → libera acesso e registra venda
  - PAYMENT_RECEIVED  → (alias do confirmed)
  - PAYMENT_REFUNDED  → revoga acesso
  - PAYMENT_CHARGEBACK_REQUESTED → flag de risco
```

> **Para configurar no Asaas:** Dashboard → Integrações → Webhooks → URL: `https://mundo-mapping-marketplace-production.up.railway.app/api/webhook/asaas`

### Assinaturas (planos de empresa)

| Plano | Features |
|---|---|
| `associate` | Limite básico de produtos, sem relatório de campanha |
| `partner` | Mais produtos, acesso ao relatório |
| `elite` | Sem limite, todos os recursos |

Assinatura criada/cancelada em `/mundo-mapping/afiliados/perfil`. O `asaas_subscription_id` é armazenado em `profiles` para gestão do ciclo de vida.

---

## 🔗 Sistema de Afiliados

### Geração de links

```
/r/[codigo]  →  registrar_clique(codigo)  →  redirect para url_produto do link
```

- `codigo`: string de 8 chars alfanuméricos únicos (gerado no client com `crypto.getRandomValues`)
- Colisão tratada com retry loop (até 5 tentativas, `23505` = conflict)
- `registrar_clique()` é RPC com `SECURITY DEFINER` — acessível por usuário anon sem auth

### Atribuição

- **Automática:** link gerado imediatamente ao clicar "Me afiliar" no marketplace
- **Manual:** cria `pedidos_afiliacao` → empresa aprova em `/afiliados/solicitacoes` → link criado

### Tracking de conversão

```sql
-- links_afiliados
cliques  INTEGER DEFAULT 0   -- incrementado por registrar_clique()
vendas   INTEGER DEFAULT 0   -- incrementado pelo webhook de pagamento

-- vendas
creator_id     UUID    -- rastreabilidade da comissão por creator
link_afiliado_id UUID
comissao       NUMERIC -- valor calculado no checkout
valor          NUMERIC -- GMV da venda
```

### Comissão

Calculada no `POST /api/checkout/payment`:
```typescript
if (comissao_tipo === "percent") comissao = preco * comissao_valor / 100;
if (comissao_tipo === "fixed")   comissao = comissao_valor;
// Considerando comissao_base: 'gross' (sobre valor bruto) ou 'net' (deduz frete/taxas)
```

---

## 📦 Funcionalidades Implementadas

### Área da Empresa
- [x] Cadastro/login com validação de CPF/CNPJ duplicado
- [x] Dashboard com métricas: produtos ativos, creators afiliados, comissão gerada
- [x] CRUD completo de produtos (rascunho, publicado, pausado)
- [x] Configuração de checkout customizável: cor, headline, CTA, depoimentos, banner
- [x] Preview de checkout em tempo real (desktop + mobile com frame de celular)
- [x] Aprovação manual/automática de afiliados
- [x] Geração de links de afiliado com código único
- [x] Relatório de campanhas (cliques, vendas, creators) — planos partner/elite
- [x] Gestão de creators afiliados (ativar/desativar links)
- [x] Extrato financeiro de vendas geradas
- [x] Área de membros: módulos, aulas, materiais por produto digital
- [x] Order bump e upsell configuráveis
- [x] Cupons de desconto
- [x] Gestão de plano + assinatura Asaas recorrente

### Área do Influenciador
- [x] Cadastro/login com handle do Instagram
- [x] Marketplace de produtos disponíveis para afiliação
- [x] Geração/cópia de link de afiliado único
- [x] Extrato de links ativos e cliques rastreados
- [x] Histórico de comissões e vendas
- [x] Solicitação de saque

### Checkout Público
- [x] Checkout por slug do produto (`/checkout/[slug]`)
- [x] Pagamento com cartão de crédito (Asaas)
- [x] Pagamento com PIX (QR Code com polling de status)
- [x] Atribuição de venda ao link de afiliado via `?ref=[codigo]`
- [x] Página de obrigado pós-compra

### Admin
- [x] Dashboard global (influenciadores, empresas, saques, produtos)
- [x] Aprovação/rejeição de influenciadores
- [x] Gestão de planos de empresa
- [x] Processamento de saques
- [x] Todas as queries via service role (sem restrição de RLS)

### Infraestrutura
- [x] RLS completo com isolamento por `empresa_id` e `user_type`
- [x] Trigger `handle_new_user` — cria profile automaticamente
- [x] Deploy contínuo via Railway (push em `main` = deploy automático)
- [x] Layout server-side com validação de `user_type` (sem acesso cruzado entre seções)

---

## ⚠️ Pendências Conhecidas

| Pendência | Detalhe |
|---|---|
| **E-mail transacional** | Supabase envia e-mail de confirmação padrão. Não há e-mails customizados (boas-vindas, aprovação de afiliado, notificação de venda). Integrar Resend ou similar. |
| **Domínio próprio** | Plataforma está em subdomínio Railway. Apontar domínio customizado no Railway e atualizar `NEXT_PUBLIC_APP_URL`. |
| **Recuperação de carrinho** | Não há fluxo de abandono de checkout. Pedidos em `status: 'pendente'` ficam sem tratamento. |
| **Health score de creators** | Campos `score_minimo`, `whitelist_only`, `exige_social_proof` existem no schema mas não são usados ativamente. |
| **Antifraude** | Chargebacks são registrados no webhook mas sem lógica de bloqueio automático. |
| **Notificações em tempo real** | Há canal Supabase Realtime no relatório de campanha, mas sem notificações push para aprovações/vendas. |
| **Exportação de dados** | Sem CSV/Excel de extrato financeiro ou relatório de creators. |
| **Internacionalização** | Interface 100% em português. Sem suporte a outros idiomas. |

---

## 🚀 Deploy

### Rodar localmente

```bash
git clone https://github.com/pedronabozni-pixel/mundo-mapping-marketplace.git
cd mundo-mapping-marketplace
npm install

# Criar .env.local com as variáveis abaixo
cp .env.example .env.local  # (criar manualmente se não existir)

npm run dev
```

**.env.local mínimo:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ASAAS_API_KEY=...
ASAAS_WEBHOOK_TOKEN=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Migrations Supabase

Rodar os SQLs da pasta `/supabase/migrations/` em ordem no SQL Editor do Supabase:

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
20260519_handle_new_user_trigger.sql     ← trigger de criação de perfil
20260519_fix_rls_isolamento_produtos.sql ← RLS corrigido (rodar por último)
```

### Deploy Railway

1. Conectar repositório GitHub ao Railway
2. Configurar variáveis de ambiente no painel Railway
3. Qualquer push em `main` dispara deploy automático
4. Build command: `npm run build` (Next.js detectado automaticamente)
5. Webhook Asaas deve ser atualizado se a URL mudar

---

## 🏦 Modelo de negócio (contexto para integração)

- **Empresa/Produtor** paga plano recorrente (Asaas) para usar a plataforma
- **Influenciador** recebe comissão por venda gerada via seu link
- **Plataforma** opera como intermediária: rastreia, registra e processa as comissões
- Repasse de comissão para influenciadores é **manual** (via `solicitacoes_saque` + processamento admin)
- Não há split automático de pagamento — toda a venda entra para a empresa, que repassa conforme extrato

---

## 📞 Contato

| Pessoa | E-mail | Papel |
|---|---|---|
| Pedro (admin) | pedronabozni@gmail.com | Dono do projeto, acesso total |
| Daniel (dev externo) | Daniel@mapa360.com.br | Avaliação backend / integração |

---

*Documento gerado em 19/05/2026. Para atualizações, contatar pedronabozni@gmail.com.*
