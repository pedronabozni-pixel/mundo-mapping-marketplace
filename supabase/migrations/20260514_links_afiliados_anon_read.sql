-- Allow anonymous users to read active affiliate links (needed for /r/[codigo] redirect route)
-- Without this policy, unauthenticated visitors trigger the fallback instead of the product redirect.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'links_afiliados'
      AND policyname = 'links: public redirect read'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "links: public redirect read"
        ON public.links_afiliados FOR SELECT
        TO anon
        USING (ativo = true)
    $policy$;
  END IF;
END $$;

GRANT SELECT ON TABLE public.links_afiliados TO anon;

NOTIFY pgrst, 'reload schema';
