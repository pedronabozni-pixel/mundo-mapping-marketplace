-- Adiciona coluna status_aprovacao que estava sendo selecionada mas não existia
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status_aprovacao text DEFAULT 'pendente';

-- Permite que admin leia todos os profiles (necessário quando SERVICE_ROLE_KEY não bypassa RLS)
DROP POLICY IF EXISTS "admin pode ver todos os profiles" ON public.profiles;
CREATE POLICY "admin pode ver todos os profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT user_type FROM public.profiles p WHERE p.id = auth.uid()) = 'admin'
  );

NOTIFY pgrst, 'reload schema';
