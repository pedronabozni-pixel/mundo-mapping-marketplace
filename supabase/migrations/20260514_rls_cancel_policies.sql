-- Creator pode deletar seus próprios pedidos pendentes (cancelar solicitação)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'pedidos_afiliacao'
      AND policyname = 'pedidos_creator_delete'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY pedidos_creator_delete ON public.pedidos_afiliacao
        FOR DELETE USING (auth.uid() = creator_id)
    $policy$;
  END IF;
END $$;

GRANT DELETE ON TABLE public.pedidos_afiliacao TO authenticated;

-- Creator pode atualizar seus próprios links (cancelar afiliação via ativo = false)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'links_afiliados'
      AND policyname = 'creator_update_own_link'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY creator_update_own_link ON public.links_afiliados
        FOR UPDATE USING (auth.uid() = creator_id)
    $policy$;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
