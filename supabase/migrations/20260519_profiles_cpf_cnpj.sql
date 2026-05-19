-- Rename cnpj → cpf_cnpj to support both CPF (individuals) and CNPJ (companies)
ALTER TABLE public.profiles
  RENAME COLUMN cnpj TO cpf_cnpj;
