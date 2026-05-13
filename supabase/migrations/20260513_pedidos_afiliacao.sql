-- Tabela de solicitações de afiliação (aprovação manual)
CREATE TABLE IF NOT EXISTS public.pedidos_afiliacao (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_nome      text        NOT NULL DEFAULT '',
  produto_id        uuid        NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  produto_nome      text        NOT NULL DEFAULT '',
  produto_slug      text        NOT NULL DEFAULT '',
  empresa_id        uuid        NOT NULL,
  empresa_nome      text        NOT NULL DEFAULT '',
  status            text        NOT NULL DEFAULT 'pendente'
                                CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  motivo_rejeicao   text,
  comissao_tipo     text        NOT NULL DEFAULT 'percent',
  comissao_valor    numeric     NOT NULL DEFAULT 0,
  preco_produto     numeric     NOT NULL DEFAULT 0,
  url_produto       text        NOT NULL DEFAULT '',
  criado_em         timestamptz NOT NULL DEFAULT now(),
  atualizado_em     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (creator_id, produto_id)
);

-- RLS
ALTER TABLE public.pedidos_afiliacao ENABLE ROW LEVEL SECURITY;

-- Creator vê e insere seus próprios pedidos
CREATE POLICY IF NOT EXISTS "pedidos_creator_select" ON public.pedidos_afiliacao
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY IF NOT EXISTS "pedidos_creator_insert" ON public.pedidos_afiliacao
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY IF NOT EXISTS "pedidos_creator_update" ON public.pedidos_afiliacao
  FOR UPDATE USING (auth.uid() = creator_id);

-- Empresa vê e atualiza pedidos dos seus produtos
CREATE POLICY IF NOT EXISTS "pedidos_empresa_select" ON public.pedidos_afiliacao
  FOR SELECT USING (auth.uid() = empresa_id);

CREATE POLICY IF NOT EXISTS "pedidos_empresa_update" ON public.pedidos_afiliacao
  FOR UPDATE USING (auth.uid() = empresa_id);

-- Empresa pode criar link no links_afiliados ao aprovar
-- (garante que a empresa também possa inserir linhas em nome do creator)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'links_afiliados'
      AND policyname = 'empresa_insert_link'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY empresa_insert_link ON public.links_afiliados
        FOR INSERT WITH CHECK (auth.uid() = empresa_id)
    $policy$;
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON TABLE public.pedidos_afiliacao TO authenticated;

NOTIFY pgrst, 'reload schema';
