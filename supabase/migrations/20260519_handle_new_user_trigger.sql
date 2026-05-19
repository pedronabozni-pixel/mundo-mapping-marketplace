-- Trigger: cria perfil automaticamente em auth.users INSERT
-- Corrigido: usa instagram_handle (não instagram) e company_name que existem na tabela profiles
-- SECURITY DEFINER garante bypass total do RLS

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    user_type,
    full_name,
    company_name,
    cpf_cnpj,
    instagram_handle,
    plano,
    status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'empresa'),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'company_name'
    ),
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'cpf_cnpj',
    NEW.raw_user_meta_data->>'instagram',
    'associate',
    'ativo'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
