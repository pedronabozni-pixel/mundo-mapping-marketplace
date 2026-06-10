-- Idempotência do webhook Asaas + anti-duplicação de vendas.
--
-- ATENÇÃO: este SQL JÁ FOI APLICADO manualmente em produção (2026-06-10).
-- O arquivo existe apenas para manter o histórico de migrations em dia.

-- Registro de eventos de webhook já processados. O insert com unique em
-- event_id é o que garante a deduplicação: o segundo insert do mesmo evento
-- falha com 23505 e o handler responde 200 sem reprocessar.
create table if not exists public.webhook_events (
  id bigint generated always as identity primary key,
  event_id text not null unique,
  event_type text,
  payment_id text,
  received_at timestamptz not null default now()
);

-- RLS habilitado SEM policies: somente o service role (admin client) escreve.
alter table public.webhook_events enable row level security;

-- Última linha de defesa contra venda duplicada: no máximo uma venda por pedido.
alter table public.vendas
  add constraint vendas_pedido_id_unique unique (pedido_id);
