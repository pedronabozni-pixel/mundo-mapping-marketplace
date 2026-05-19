-- ============================================================
-- Tabela de solicitações de saque dos influenciadores
-- ============================================================

CREATE TABLE public.solicitacoes_saque (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id     uuid        NOT NULL REFERENCES auth.users(id),
  valor          numeric     NOT NULL,
  chave_pix      text        NOT NULL,
  tipo_chave_pix text        NOT NULL,
  status         text        NOT NULL DEFAULT 'pendente',
  criado_em      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.solicitacoes_saque ENABLE ROW LEVEL SECURITY;

-- Creator vê e cria suas próprias solicitações
CREATE POLICY "saque_creator_insert" ON public.solicitacoes_saque
  FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "saque_creator_select" ON public.solicitacoes_saque
  FOR SELECT TO authenticated
  USING (creator_id = auth.uid());

-- Admin tem acesso total
CREATE POLICY "saque_admin_all" ON public.solicitacoes_saque
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

GRANT INSERT, SELECT ON public.solicitacoes_saque TO authenticated;

CREATE INDEX IF NOT EXISTS saques_creator_id_idx ON public.solicitacoes_saque (creator_id);
CREATE INDEX IF NOT EXISTS saques_status_idx     ON public.solicitacoes_saque (status);

NOTIFY pgrst, 'reload schema';
