-- ============================================================
-- Tabela vendas: registro de cada venda gerada por afiliado
-- Populada pelo webhook do Asaas ao confirmar o pagamento
-- ============================================================

CREATE TABLE IF NOT EXISTS public.vendas (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id        uuid        REFERENCES public.pedidos(id) ON DELETE SET NULL,
  produto_id       uuid        NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  empresa_id       uuid        NOT NULL,
  creator_id       uuid,
  link_afiliado_id uuid        REFERENCES public.links_afiliados(id) ON DELETE SET NULL,
  valor            numeric     NOT NULL,
  comissao_creator numeric     NOT NULL DEFAULT 0,
  criado_em        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

-- Empresa vê suas próprias vendas
CREATE POLICY "vendas_empresa_select"
  ON public.vendas FOR SELECT TO authenticated
  USING (empresa_id = auth.uid());

-- Creator vê as vendas que gerou
CREATE POLICY "vendas_creator_select"
  ON public.vendas FOR SELECT TO authenticated
  USING (creator_id = auth.uid());

GRANT SELECT ON public.vendas TO authenticated;

CREATE INDEX IF NOT EXISTS vendas_empresa_id_idx ON public.vendas (empresa_id);
CREATE INDEX IF NOT EXISTS vendas_creator_id_idx ON public.vendas (creator_id);
CREATE INDEX IF NOT EXISTS vendas_pedido_id_idx  ON public.vendas (pedido_id);

-- ============================================================
-- Adiciona contador de vendas na tabela links_afiliados
-- (contador denormalizado para exibição rápida nos dashboards)
-- ============================================================

ALTER TABLE public.links_afiliados
  ADD COLUMN IF NOT EXISTS vendas integer NOT NULL DEFAULT 0;

-- ============================================================
-- Função atômica para incrementar o contador de vendas de um link
-- SECURITY DEFINER: pode ser chamada pelo service role sem RLS
-- ============================================================

CREATE OR REPLACE FUNCTION public.incrementar_vendas_link(p_link_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.links_afiliados
  SET vendas = COALESCE(vendas, 0) + 1
  WHERE id = p_link_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.incrementar_vendas_link(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
