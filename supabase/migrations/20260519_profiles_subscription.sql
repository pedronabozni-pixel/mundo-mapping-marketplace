-- Add subscription columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS asaas_customer_id text,
  ADD COLUMN IF NOT EXISTS asaas_subscription_id text,
  ADD COLUMN IF NOT EXISTS plano_valido_ate timestamptz,
  ADD COLUMN IF NOT EXISTS plano_status text NOT NULL DEFAULT 'ativo';
