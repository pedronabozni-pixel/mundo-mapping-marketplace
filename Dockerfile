FROM node:20-alpine

# Build args: Railway passa as env vars do dashboard como ARGs ao build
# (quando o builder é DOCKERFILE). NEXT_PUBLIC_* PRECISA estar disponível
# durante `next build` para ser inlinado no bundle do client — não basta
# estar disponível em runtime.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Re-exporta como ENV para que `next build` (rodado abaixo) leia via process.env
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
