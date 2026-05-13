-- Execute no Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- É seguro rodar múltiplas vezes: CREATE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS

-- ─── Tabela produtos ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.produtos (
  id                      UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  slug                    TEXT         NOT NULL UNIQUE,
  empresa_id              UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_nome            TEXT,
  nome                    TEXT         NOT NULL,
  marca                   TEXT         DEFAULT 'Mundo Mapping',
  categoria               TEXT         DEFAULT 'Infoproduto | Ebook',
  descricao               TEXT         DEFAULT '',
  url_produto             TEXT         DEFAULT '',
  preco                   NUMERIC(10,2) NOT NULL DEFAULT 0,
  comissao_tipo           TEXT         NOT NULL DEFAULT 'percent',
  comissao_valor          NUMERIC(10,2) NOT NULL DEFAULT 20,
  comissao_base           TEXT         DEFAULT 'gross',
  garantia_dias           INTEGER      DEFAULT 14,
  liberacao_dias          INTEGER      DEFAULT 14,
  payout_mode             TEXT         DEFAULT 'platform_ledger',
  attribution_model       TEXT         DEFAULT 'last_click',
  attribution_window_dias INTEGER      DEFAULT 7,
  cupom_habilitado        BOOLEAN      DEFAULT true,
  aprovacao_modo          TEXT         DEFAULT 'manual',
  visivel_shopping        BOOLEAN      DEFAULT false,
  status                  TEXT         DEFAULT 'draft',
  publico                 TEXT         DEFAULT '',
  score_minimo            INTEGER      DEFAULT 70,
  seguidores_minimo       INTEGER      DEFAULT 5000,
  regioes_permitidas      TEXT         DEFAULT 'Brasil',
  whitelist_only          BOOLEAN      DEFAULT false,
  exige_social_proof      BOOLEAN      DEFAULT false,
  materiais_resumo        TEXT         DEFAULT '',
  capa_modo               TEXT         DEFAULT 'link',
  capa_url                TEXT         DEFAULT '',
  capa_nome               TEXT         DEFAULT '',
  promo_modo              TEXT         DEFAULT 'link',
  promo_url               TEXT         DEFAULT '',
  promo_nome              TEXT         DEFAULT '',
  checkout_cor            TEXT         DEFAULT '#dc2626',
  checkout_banner_modo    TEXT         DEFAULT 'link',
  checkout_banner_url     TEXT         DEFAULT '',
  checkout_banner_nome    TEXT         DEFAULT '',
  checkout_headline       TEXT         DEFAULT '',
  checkout_subheadline    TEXT         DEFAULT '',
  checkout_cta            TEXT         DEFAULT 'Comprar agora',
  checkout_garantia       TEXT         DEFAULT '',
  checkout_suporte        TEXT         DEFAULT '',
  checkout_highlights     TEXT         DEFAULT '',
  suporte_email           TEXT         DEFAULT 'suporte@mundomapping.com',
  logistica_modo          TEXT         DEFAULT 'digital',
  estoque_requerido       BOOLEAN      DEFAULT false,
  frete_gerido_por        TEXT         DEFAULT 'na',
  reserva_requerida       BOOLEAN      DEFAULT false,
  politica_no_show        TEXT         DEFAULT '',
  criado_em               TIMESTAMPTZ  DEFAULT now(),
  atualizado_em           TIMESTAMPTZ  DEFAULT now()
);

-- ─── Adiciona colunas que podem estar faltando em tabela já existente ─────────
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS empresa_nome            TEXT;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS marca                   TEXT         DEFAULT 'Mundo Mapping';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS categoria               TEXT         DEFAULT 'Infoproduto | Ebook';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS descricao               TEXT         DEFAULT '';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS url_produto             TEXT         DEFAULT '';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS comissao_base           TEXT         DEFAULT 'gross';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS liberacao_dias          INTEGER      DEFAULT 14;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS payout_mode             TEXT         DEFAULT 'platform_ledger';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS attribution_model       TEXT         DEFAULT 'last_click';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS attribution_window_dias INTEGER      DEFAULT 7;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS cupom_habilitado        BOOLEAN      DEFAULT true;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS aprovacao_modo          TEXT         DEFAULT 'manual';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS visivel_shopping        BOOLEAN      DEFAULT false;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS publico                 TEXT         DEFAULT '';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS score_minimo            INTEGER      DEFAULT 70;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS seguidores_minimo       INTEGER      DEFAULT 5000;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS regioes_permitidas      TEXT         DEFAULT 'Brasil';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS whitelist_only          BOOLEAN      DEFAULT false;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS exige_social_proof      BOOLEAN      DEFAULT false;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS materiais_resumo        TEXT         DEFAULT '';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS capa_modo               TEXT         DEFAULT 'link';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS capa_url                TEXT         DEFAULT '';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS capa_nome               TEXT         DEFAULT '';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS promo_modo              TEXT         DEFAULT 'link';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS promo_url               TEXT         DEFAULT '';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS promo_nome              TEXT         DEFAULT '';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS checkout_cor            TEXT         DEFAULT '#dc2626';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS checkout_banner_modo    TEXT         DEFAULT 'link';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS checkout_banner_url     TEXT         DEFAULT '';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS checkout_banner_nome    TEXT         DEFAULT '';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS checkout_headline       TEXT         DEFAULT '';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS checkout_subheadline    TEXT         DEFAULT '';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS checkout_cta            TEXT         DEFAULT 'Comprar agora';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS checkout_garantia       TEXT         DEFAULT '';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS checkout_suporte        TEXT         DEFAULT '';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS checkout_highlights     TEXT         DEFAULT '';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS suporte_email           TEXT         DEFAULT 'suporte@mundomapping.com';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS logistica_modo          TEXT         DEFAULT 'digital';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS estoque_requerido       BOOLEAN      DEFAULT false;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS frete_gerido_por        TEXT         DEFAULT 'na';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS reserva_requerida       BOOLEAN      DEFAULT false;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS politica_no_show        TEXT         DEFAULT '';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS criado_em               TIMESTAMPTZ  DEFAULT now();
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS atualizado_em           TIMESTAMPTZ  DEFAULT now();

-- ─── Permissões ───────────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.produtos TO authenticated;
GRANT SELECT                         ON TABLE public.produtos TO anon;

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "empresa pode ver seus produtos" ON public.produtos;
DROP POLICY IF EXISTS "empresa pode criar produto"     ON public.produtos;
DROP POLICY IF EXISTS "empresa pode editar produto"    ON public.produtos;
DROP POLICY IF EXISTS "empresa pode deletar produto"   ON public.produtos;
DROP POLICY IF EXISTS "produtos publicados visíveis"   ON public.produtos;

CREATE POLICY "empresa pode ver seus produtos"
  ON public.produtos FOR SELECT
  USING (empresa_id = auth.uid());

CREATE POLICY "empresa pode criar produto"
  ON public.produtos FOR INSERT
  WITH CHECK (empresa_id = auth.uid());

CREATE POLICY "empresa pode editar produto"
  ON public.produtos FOR UPDATE
  USING (empresa_id = auth.uid());

CREATE POLICY "empresa pode deletar produto"
  ON public.produtos FOR DELETE
  USING (empresa_id = auth.uid());

CREATE POLICY "produtos publicados visíveis"
  ON public.produtos FOR SELECT
  USING (status = 'published');

-- ─── Recarrega schema cache do PostgREST (obrigatório após ALTER TABLE) ────────
NOTIFY pgrst, 'reload schema';
