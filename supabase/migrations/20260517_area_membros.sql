-- ============================================================
-- ÁREA DE MEMBROS — Mundo Mapping
-- Tabelas: modulos, aulas, materiais_aula, acessos_membros, progresso_aulas
-- empresa_id = auth.uid() (sem tabela empresas separada)
-- ============================================================

-- 1. Módulos de um produto digital
CREATE TABLE IF NOT EXISTS modulos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  produto_id  uuid NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  titulo      text NOT NULL,
  descricao   text,
  ordem       int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE modulos ENABLE ROW LEVEL SECURITY;

-- empresa pode gerenciar seus próprios módulos
CREATE POLICY "empresa_modulos_all" ON modulos
  FOR ALL USING (empresa_id = auth.uid());

-- membros com acesso podem ver os módulos
CREATE POLICY "membro_modulos_select" ON modulos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM acessos_membros
      WHERE produto_id = modulos.produto_id
        AND comprador_email = auth.jwt() ->> 'email'
        AND ativo = true
    )
  );

-- 2. Aulas dentro de um módulo
CREATE TABLE IF NOT EXISTS aulas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  modulo_id       uuid NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  produto_id      uuid NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  titulo          text NOT NULL,
  descricao       text,
  video_url       text,
  duracao_minutos int,
  ordem           int NOT NULL DEFAULT 0,
  liberado_em     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empresa_aulas_all" ON aulas
  FOR ALL USING (empresa_id = auth.uid());

CREATE POLICY "membro_aulas_select" ON aulas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM acessos_membros
      WHERE produto_id = aulas.produto_id
        AND comprador_email = auth.jwt() ->> 'email'
        AND ativo = true
    )
  );

-- 3. Materiais de apoio de uma aula
CREATE TABLE IF NOT EXISTS materiais_aula (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  aula_id    uuid NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  titulo     text NOT NULL,
  url        text NOT NULL,
  tipo       text NOT NULL DEFAULT 'pdf', -- pdf, link, arquivo
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE materiais_aula ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empresa_materiais_all" ON materiais_aula
  FOR ALL USING (empresa_id = auth.uid());

CREATE POLICY "membro_materiais_select" ON materiais_aula
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM acessos_membros
      WHERE produto_id = materiais_aula.produto_id
        AND comprador_email = auth.jwt() ->> 'email'
        AND ativo = true
    )
  );

-- 4. Acessos dos compradores (concedido automático na compra ou manual pela empresa)
CREATE TABLE IF NOT EXISTS acessos_membros (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  produto_id      uuid NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  pedido_id       uuid REFERENCES pedidos(id) ON DELETE SET NULL,
  comprador_email text NOT NULL,
  comprador_nome  text,
  ativo           boolean NOT NULL DEFAULT true,
  expira_em       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (produto_id, comprador_email)
);

ALTER TABLE acessos_membros ENABLE ROW LEVEL SECURITY;

-- empresa gerencia acessos dos seus produtos
CREATE POLICY "empresa_acessos_all" ON acessos_membros
  FOR ALL USING (empresa_id = auth.uid());

-- comprador vê o próprio acesso
CREATE POLICY "membro_acesso_select" ON acessos_membros
  FOR SELECT USING (
    comprador_email = auth.jwt() ->> 'email'
  );

-- API route pode inserir via service role (sem RLS)
-- Anon não tem acesso

-- 5. Progresso das aulas por membro
CREATE TABLE IF NOT EXISTS progresso_aulas (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  aula_id    uuid NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  concluida  boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, aula_id)
);

ALTER TABLE progresso_aulas ENABLE ROW LEVEL SECURITY;

-- membro gerencia apenas seu próprio progresso
CREATE POLICY "membro_progresso_all" ON progresso_aulas
  FOR ALL USING (user_id = auth.uid());

-- índices de performance
CREATE INDEX IF NOT EXISTS idx_modulos_produto ON modulos (produto_id, ordem);
CREATE INDEX IF NOT EXISTS idx_aulas_modulo ON aulas (modulo_id, ordem);
CREATE INDEX IF NOT EXISTS idx_acessos_email ON acessos_membros (comprador_email, ativo);
CREATE INDEX IF NOT EXISTS idx_progresso_user ON progresso_aulas (user_id, produto_id);
