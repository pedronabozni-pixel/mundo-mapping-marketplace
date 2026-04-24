# Mundo Mapping Marketplace

Projeto Next.js da Mundo Mapping com dois contextos principais:

- painel da empresa em `/mundo-mapping/afiliados`
- portal do influenciador em `/mundo-mapping/influenciadores`

As áreas legadas do projeto-base anterior foram removidas da aplicação. O foco deste repositório agora é o marketplace da Mundo Mapping.

## Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Prisma
- NextAuth

## O que é da Mundo Mapping

Rotas principais:

- `/`
- `/mundo-mapping/afiliados`
- `/mundo-mapping/afiliados/produtos/novo`
- `/mundo-mapping/afiliados/produtos/[slug]`
- `/mundo-mapping/influenciadores`
- `/mundo-mapping/influenciadores/marketplace`

Principais componentes:

- `src/components/mundo-mapping/*`
- `src/app/mundo-mapping/*`

Comportamento atual:

- `/` redireciona para `/mundo-mapping/afiliados`
- rotas legadas do projeto-base redirecionam para `/mundo-mapping/legado-desativado`

## Banco de dados

O projeto suporta dois cenários:

### 1. Padrão do projeto: SQLite

É o modo mais simples para desenvolvimento local e também o padrão atual do deploy deste repositório.

- schema: `prisma/schema.prisma`
- provider: `sqlite`
- valor padrão recomendado:

```env
DATABASE_URL="file:./dev.db"
```

### 2. Opcional: PostgreSQL

Use apenas se você realmente quiser rodar com Postgres em produção.

- schema: `prisma/schema.postgres.prisma`
- provider: `postgresql`

Exemplo:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
```

## Variáveis de ambiente

### Obrigatórias para a Mundo Mapping

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="change-me"
NEXTAUTH_URL="http://localhost:3000"
APP_URL="http://localhost:3000"
RUN_PRISMA_SEED="false"
```

## Como rodar localmente

1. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

2. Instale as dependências:

```bash
npm install
```

3. Gere o Prisma Client:

```bash
npm run prisma:generate
```

4. Sincronize o banco:

```bash
npm run prisma:db:push
```

5. Se quiser dados iniciais:

```bash
npm run prisma:seed
```

6. Rode o projeto:

```bash
npm run dev
```

## Deploy

### Deploy padrão deste repositório

O `Dockerfile` agora assume por padrão:

- schema SQLite
- `DATABASE_URL=file:./prod.db` se nenhuma variável for informada

Ou seja: o deploy não força PostgreSQL.

### Se quiser usar PostgreSQL em deploy

Defina as variáveis:

```env
PRISMA_SCHEMA_PATH=prisma/schema.postgres.prisma
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
```

## Scripts úteis

```bash
npm run dev
npm run build
npm run start
npm run prisma:generate
npm run prisma:db:push
npm run prisma:generate:prod
npm run prisma:db:push:prod
npm run prisma:seed
```

## Observações importantes

- A aplicação agora entra diretamente na Mundo Mapping e as rotas antigas foram substituídas por uma página de legado desativado.
- O código de interface e rotas legadas foi removido do app.
- Ainda existem alguns campos históricos nos schemas Prisma, que podem ser refatorados depois com mais calma se você quiser simplificar o domínio de dados.
