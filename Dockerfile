FROM node:20-alpine AS base
WORKDIR /app

ARG PRISMA_SCHEMA_PATH=prisma/schema.prisma

COPY package*.json ./
RUN npm ci

COPY . .

# Default deploy uses SQLite. You can override this at build/runtime with:
# PRISMA_SCHEMA_PATH=prisma/schema.postgres.prisma
# DATABASE_URL=postgresql://...
ENV PRISMA_SCHEMA_PATH=${PRISMA_SCHEMA_PATH}
ENV DATABASE_URL=file:./prod.db

RUN npx prisma generate --schema ${PRISMA_SCHEMA_PATH}
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

# Keep schema in sync and run Next.js.
# Optional one-time seed in production via RUN_PRISMA_SEED=true.
CMD sh -c "npx prisma db push --schema ${PRISMA_SCHEMA_PATH} && if [ \"${RUN_PRISMA_SEED}\" = \"true\" ]; then npm run prisma:seed; fi && npm run start -- -p ${PORT:-3000}"
