-- ============================================================
-- CUPONS DE DESCONTO — Mapping Partners
-- ============================================================

-- 1. Tabela cupons
CREATE TABLE IF NOT EXISTS cupons (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id        uuid          NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  empresa_id        uuid          NOT NULL,
  codigo            text          NOT NULL,
  tipo              text          NOT NULL DEFAULT 'percentual' CHECK (tipo IN ('percentual')),
  valor             numeric(5,2)  NOT NULL CHECK (valor > 0 AND valor <= 100),
  limit_usos        integer       NULL,
  usos_realizados   integer       NOT NULL DEFAULT 0,
  validade          timestamptz   NULL,
  ativo             boolean       NOT NULL DEFAULT true,
  criado_em         timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT cupons_produto_codigo_unique UNIQUE (produto_id, codigo)
);

CREATE INDEX IF NOT EXISTS cupons_codigo_upper_idx ON cupons (upper(codigo));
CREATE INDEX IF NOT EXISTS cupons_produto_id_idx   ON cupons (produto_id);

-- RLS
ALTER TABLE cupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empresa_manage_cupons" ON cupons
  FOR ALL
  USING  (empresa_id = auth.uid())
  WITH CHECK (empresa_id = auth.uid());

-- 2. Campos adicionais em pedidos
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS cupom_codigo   text          NULL,
  ADD COLUMN IF NOT EXISTS cupom_desconto numeric(10,2) NOT NULL DEFAULT 0;
