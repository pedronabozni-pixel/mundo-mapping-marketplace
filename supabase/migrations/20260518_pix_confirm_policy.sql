-- Permite que anon atualize o status de pedidos pendentes confirmados via Asaas PIX
-- Segurança: apenas rows com asaas_payment_id preenchido e status = 'pendente' podem ser atualizadas
-- e só para status = 'aprovado'. A validação real vem da consulta ao Asaas na rota.
CREATE POLICY "pedidos_anon_pix_confirm"
  ON public.pedidos
  FOR UPDATE
  TO anon
  USING  (status = 'pendente' AND asaas_payment_id IS NOT NULL)
  WITH CHECK (status = 'aprovado');

GRANT UPDATE (status, atualizado_em) ON public.pedidos TO anon;
