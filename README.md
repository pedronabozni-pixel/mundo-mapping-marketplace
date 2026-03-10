# Decentralized Club (SaaS MVP)

Plataforma SaaS com:
- Area do Usuario (membro pagante)
- Area Administrativa (admin)
- Integracao por webhook com Kirvano para ativacao/bloqueio automatico de assinatura

## Stack
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS (tema escuro estilo fintech)
- Prisma (SQLite local + PostgreSQL prod)
- NextAuth (credentials)

## Funcionalidades implementadas

### 1) Integracao Kirvano
- Endpoint: `POST /api/webhooks/kirvano`
- Valida assinatura do webhook via HMAC SHA-256 (`x-kirvano-signature`)
- Processa eventos:
  - `pagamento_aprovado`
  - `assinatura_ativa`
  - `cancelamento`
  - `reembolso`
  - `falha_pagamento`
- Regras automaticas:
  - Cria usuario no pagamento aprovado
  - Ativa/atualiza plano e status
  - Bloqueia acesso em cancelamento/falha
  - Dispara email de ativacao de conta para definir senha
- Idempotencia por `event_id`
- Salva no banco:
  - id de transacao
  - status da assinatura
  - data de renovacao
  - plano contratado

### 2) Area do Usuario
- Login com email/senha
- Ativacao de conta por email (definicao de senha)
- Reset de senha
- Bloqueio de acesso por status da assinatura
- Dashboard com:
  - Precos BTC/ETH/SOL/BNB (CoinGecko)
  - Ultima atualizacao diaria
  - Ultima analise exclusiva
  - Conteudos recentes
  - Status e proxima cobranca da assinatura
- Atualizacoes diarias:
  - Lista por data
  - Busca
  - Filtro por mes
  - Artigo detalhado
- Analises exclusivas por categoria:
  - Macro, Tecnica, Narrativas, Institucional, EUA
- Videos:
  - Player embutido (YouTube/Vimeo)
  - Organizacao por modulo
  - Restricao por plano

### 3) Area Admin
- Gestao de conteudo:
  - Criar e excluir atualizacoes, analises e videos
  - Campos para agendamento de publicacao
  - Link de PDF opcional nas analises
- Gestao de usuarios:
  - Listagem de membros
  - Ver plano/status
  - Alterar plano manualmente
  - Bloquear/desbloquear acesso
  - Exportar CSV (`/api/export/members.csv`)
- Gestao de planos:
  - Criar plano
  - Ativar/desativar plano
  - Associar `kirvanoProductId`
  - Definir permissoes JSON
- Metricas:
  - Membros ativos
  - Receita mensal estimada
  - Taxa de cancelamento
  - Conteudos mais acessados

## Estrutura de banco (Prisma)
Principais modelos:
- `User`
- `Plan`
- `Subscription`
- `WebhookEvent`
- `DailyUpdate`
- `Analysis`
- `Video`
- `ContentView`

Arquivo: `prisma/schema.prisma`

## Como rodar

1. Copie as variaveis de ambiente:
```bash
cp .env.example .env
```

2. Local: use SQLite (ja vem no `.env.example`).

3. Instale dependencias:
```bash
npm install
```

4. Gere cliente Prisma + sincronize banco local:
```bash
npm run prisma:generate
npm run prisma:db:push
```

5. Rode seed:
```bash
npm run prisma:seed
```

6. Suba o projeto:
```bash
npm run dev
```

## Produção (Railway/PostgreSQL)
1. Use schema PostgreSQL:
```bash
npm run prisma:generate:prod
npm run prisma:db:push:prod
```
2. Defina `DATABASE_URL` de PostgreSQL no ambiente da Railway.
3. Para envio de email de ativacao, configure:
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
   - `NEXTAUTH_URL` (URL publica da aplicacao)

## Credenciais seed
- Admin: `admin@decentralized.club`
- Senha: `Admin@12345`

## Rotas principais
- Login: `/login`
- Ativacao de conta: `/activate-account?token=...`
- Reset senha: `/reset-password`
- Membro: `/app/dashboard`
- Admin: `/admin`
- Loja Genesis: `/loja`
- Loja Admin (isolado): `/loja/admin` (login em `/loja/admin/login`)
- Loja Admin alternativo: `/admin-loja` (login em `/admin-loja/login`)

## Observacoes
- Conteudo foi estruturado com foco educacional (sem promessa de rentabilidade).
- O fluxo de ativacao usa token com expiracao de 24h enviado por email.
- Upload de arquivo esta modelado via URL; para upload fisico, integrar storage (S3/Supabase Storage).

---

## Loja Genesis Distribuidora (E-commerce isolado)

Implementacao front-end da loja foi adicionada sem interromper a plataforma cripto existente.

### Caracteristicas
- Next.js + React + Tailwind CSS
- Tema premium escuro com detalhes dourados
- Home com destaque do produto ancora (`H12 Ultra SE`)
- Prova social, escassez visual e CTAs de alta conversao
- Favoritos com `localStorage`
- SEO dinamico por produto
- Newsletter (mock local em `src/data/newsletter-leads.json`)
- Estrutura pronta para Pixel (`src/lib/pixel.ts`)
- Painel admin da loja com senha e cookie proprio (sem conflito com `/admin` da cripto)

### Dados da loja
- Produtos: `src/data/products.json`
- Leads newsletter: `src/data/newsletter-leads.json`
- Configuracao admin: `src/lib/store-config.ts`
  - `STORE_ADMIN_PASSWORD`
  - `STORE_ADMIN_SESSION_TOKEN`

### Rotas da loja
- Home: `/loja`
- Produto: `/loja/produtos/[slug]`
- Favoritos: `/loja/favoritos`
- Sobre: `/loja/sobre`
- Contato: `/loja/contato`
- Admin loja: `/loja/admin`

### APIs da loja
- `GET /api/loja/products`
- `GET /api/loja/products/[slug]`
- `POST /api/loja/newsletter`
- `POST /api/loja-admin/login`
- `POST /api/loja-admin/logout`
- `PUT /api/loja-admin/products/[slug]`

### Deploy na Vercel
1. Suba o repositorio no GitHub.
2. Importe no painel da Vercel.
3. Configure variaveis de ambiente:
   - `STORE_ADMIN_PASSWORD`
   - `STORE_ADMIN_SESSION_TOKEN`
4. Deploy com preset `Next.js`.
