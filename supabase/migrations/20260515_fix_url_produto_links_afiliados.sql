-- Fix url_produto in links_afiliados to match the real external URL stored in produtos.
-- This corrects existing records where an internal platform URL was saved instead of
-- the checkout URL configured by the empresa.

-- 1. Show current state (run this SELECT first to verify, then comment it out)
-- SELECT la.id, la.produto_id, la.codigo, la.url_produto AS url_errada, p.url_produto AS url_correta
-- FROM public.links_afiliados la
-- JOIN public.produtos p ON p.id = la.produto_id
-- WHERE la.url_produto != p.url_produto;

-- 2. Sync url_produto in links_afiliados from the produtos table
UPDATE public.links_afiliados la
SET url_produto = p.url_produto
FROM public.produtos p
WHERE la.produto_id = p.id
  AND la.url_produto IS DISTINCT FROM p.url_produto;

-- 3. Same sync for pedidos_afiliacao (requests already created may also have the wrong URL)
UPDATE public.pedidos_afiliacao pa
SET url_produto = p.url_produto
FROM public.produtos p
WHERE pa.produto_id = p.id
  AND pa.url_produto IS DISTINCT FROM p.url_produto;

-- Verify result
SELECT la.id, la.codigo, la.url_produto, la.ativo
FROM public.links_afiliados la
JOIN public.produtos p ON p.id = la.produto_id
WHERE p.slug = 'mundo-mapping';
