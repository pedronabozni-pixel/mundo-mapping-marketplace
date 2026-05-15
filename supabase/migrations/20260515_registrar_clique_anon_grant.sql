-- Create (or replace) the affiliate redirect function with SECURITY DEFINER so it can:
-- 1. SELECT from links_afiliados even without per-row RLS
-- 2. UPDATE cliques without needing UPDATE policy on anon role
-- Grant EXECUTE to anon so unauthenticated visitors can call it via the /r/[codigo] route.

CREATE OR REPLACE FUNCTION public.registrar_clique(p_codigo text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url      text;
  v_link_id  uuid;
BEGIN
  SELECT id, url_produto
  INTO v_link_id, v_url
  FROM public.links_afiliados
  WHERE codigo = p_codigo
    AND ativo = true
  LIMIT 1;

  IF v_link_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.links_afiliados
  SET cliques = cliques + 1
  WHERE id = v_link_id;

  RETURN v_url;
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_clique(text) TO anon;
GRANT EXECUTE ON FUNCTION public.registrar_clique(text) TO authenticated;

NOTIFY pgrst, 'reload schema';
