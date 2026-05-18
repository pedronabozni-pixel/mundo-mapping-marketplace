-- ============================================================
-- ORDER BUMP & UPSELL — Mapping Partners
-- ============================================================

-- 1. Campos na tabela produtos
ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS order_bump_ativo        boolean       NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS order_bump_produto_id   uuid          REFERENCES produtos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS order_bump_preco        numeric(10,2),
  ADD COLUMN IF NOT EXISTS order_bump_texto        text,
  ADD COLUMN IF NOT EXISTS order_bump_descricao    text,
  ADD COLUMN IF NOT EXISTS upsell_ativo            boolean       NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS upsell_produto_id       uuid          REFERENCES produtos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS upsell_preco            numeric(10,2),
  ADD COLUMN IF NOT EXISTS upsell_headline         text,
  ADD COLUMN IF NOT EXISTS upsell_timer_minutos    integer       NOT NULL DEFAULT 10;

-- 2. Campos na tabela pedidos
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS order_bump_aceito       boolean       NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS order_bump_produto_id   uuid,
  ADD COLUMN IF NOT EXISTS order_bump_valor        numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS upsell_aceito           boolean       NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS upsell_produto_id       uuid,
  ADD COLUMN IF NOT EXISTS upsell_valor            numeric(10,2) NOT NULL DEFAULT 0;
