-- Fix: isolamento de dados por empresa na tabela produtos
-- Problema: "produtos publicados visíveis" permitia qualquer usuário autenticado
-- ver TODOS os produtos publicados de TODAS as empresas.
-- Solução: restringir políticas por user_type via join com profiles.

-- Remove a policy excessivamente permissiva para autenticados
DROP POLICY IF EXISTS "produtos publicados visíveis" ON public.produtos;

-- Usuários anon podem ver todos os produtos publicados (checkout público, redirect de links)
CREATE POLICY "produtos publicados anon"
  ON public.produtos FOR SELECT
  TO anon
  USING (status = 'published');

-- Influenciadores autenticados podem ver produtos publicados e visíveis no shopping (marketplace)
CREATE POLICY "influenciador pode ver shopping"
  ON public.produtos FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    AND visivel_shopping = true
    AND (
      SELECT user_type FROM public.profiles WHERE id = auth.uid()
    ) = 'influenciador'
  );

-- Admin pode ver todos os produtos
CREATE POLICY "admin pode ver todos os produtos"
  ON public.produtos FOR SELECT
  TO authenticated
  USING (
    (
      SELECT user_type FROM public.profiles WHERE id = auth.uid()
    ) = 'admin'
  );

-- Garante que as policies existentes de empresa estejam corretas
DROP POLICY IF EXISTS "empresa pode ver seus produtos" ON public.produtos;
CREATE POLICY "empresa pode ver seus produtos"
  ON public.produtos FOR SELECT
  TO authenticated
  USING (empresa_id = auth.uid());

NOTIFY pgrst, 'reload schema';
