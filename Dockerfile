FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Production uses PostgreSQL schema.
RUN npx prisma generate --schema prisma/schema.postgres.prisma
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

# Keep schema in sync, seed baseline users/plans, and then run Next.js.
CMD sh -c "npx prisma db push --schema prisma/schema.postgres.prisma && npm run prisma:seed && npm run start -- -p ${PORT:-3000}"
