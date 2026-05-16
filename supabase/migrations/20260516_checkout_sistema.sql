-- Migration: checkout_sistema
-- Adds checkout-related columns to produtos and creates the pedidos table

-- ============================================================
-- 1. Add new columns to produtos
-- ============================================================
ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS tipo_entregavel text NOT NULL DEFAULT 'digital',
  ADD COLUMN IF NOT EXISTS checkout_depoimentos jsonb,
  ADD COLUMN IF NOT EXISTS checkout_mensagem_obrigado text,
  ADD COLUMN IF NOT EXISTS checkout_cor_fundo text DEFAULT '#ffffff';

-- ============================================================
-- 2. Create pedidos table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid NOT NULL REFERENCES public.produtos(id),
  empresa_id uuid NOT NULL,
  creator_id uuid,
  link_afiliado_id uuid REFERENCES public.links_afiliados(id),
  cliente_nome text NOT NULL,
  cliente_email text NOT NULL,
  cliente_cpf text NOT NULL,
  cliente_telefone text,
  cliente_endereco jsonb,
  valor numeric NOT NULL,
  comissao_creator numeric DEFAULT 0,
  taxa_mapping numeric DEFAULT 0,
  parcelas integer DEFAULT 1,
  forma_pagamento text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  asaas_payment_id text,
  asaas_customer_id text,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- ============================================================
-- 3. Enable RLS on pedidos and create policies
-- ============================================================
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Empresa can SELECT their own orders
CREATE POLICY "pedidos_empresa_select"
  ON public.pedidos
  FOR SELECT
  TO authenticated
  USING (empresa_id = auth.uid());

-- Creator can SELECT orders where they are the creator
CREATE POLICY "pedidos_creator_select"
  ON public.pedidos
  FOR SELECT
  TO authenticated
  USING (creator_id = auth.uid());

-- Anon can INSERT (public checkout, no auth required)
CREATE POLICY "pedidos_anon_insert"
  ON public.pedidos
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- ============================================================
-- 4. Grants on pedidos
-- ============================================================
GRANT INSERT ON public.pedidos TO anon;
GRANT SELECT ON public.pedidos TO authenticated;

-- ============================================================
-- 5. Indexes on pedidos
-- ============================================================
CREATE INDEX IF NOT EXISTS pedidos_produto_id_idx
  ON public.pedidos (produto_id);

CREATE INDEX IF NOT EXISTS pedidos_empresa_id_idx
  ON public.pedidos (empresa_id);

CREATE INDEX IF NOT EXISTS pedidos_asaas_payment_id_idx
  ON public.pedidos (asaas_payment_id);

-- ============================================================
-- 6. Allow anon to SELECT published produtos (public checkout)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'produtos'
      AND policyname = 'produtos_public_checkout_read'
  ) THEN
    CREATE POLICY "produtos_public_checkout_read"
      ON public.produtos
      FOR SELECT
      TO anon
      USING (status = 'published');
  END IF;
END;
$$;

-- ============================================================
-- 7. Grant SELECT on produtos to anon
-- ============================================================
GRANT SELECT ON public.produtos TO anon;

-- ============================================================
-- 8. Reload PostgREST schema cache
-- ============================================================
NOTIFY pgrst, 'reload schema';
