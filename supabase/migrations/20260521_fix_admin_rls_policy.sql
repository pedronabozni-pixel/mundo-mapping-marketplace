-- Substitui a política autorreferencial por uma função SECURITY DEFINER
-- que bypassa RLS ao checar o user_type, evitando recursão infinita.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_type = 'admin'
  );
$$;

DROP POLICY IF EXISTS "admin pode ver todos os profiles" ON public.profiles;
CREATE POLICY "admin pode ver todos os profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin() OR id = auth.uid());

NOTIFY pgrst, 'reload schema';
