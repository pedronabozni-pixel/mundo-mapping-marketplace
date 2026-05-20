-- Novos campos do perfil de empresa (replicando plataforma antiga)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS razao_social            text,
  ADD COLUMN IF NOT EXISTS segmento                text,
  ADD COLUMN IF NOT EXISTS receber_propostas       text,
  ADD COLUMN IF NOT EXISTS celular                 text,
  ADD COLUMN IF NOT EXISTS cep                     text,
  ADD COLUMN IF NOT EXISTS endereco                text,
  ADD COLUMN IF NOT EXISTS numero                  text,
  ADD COLUMN IF NOT EXISTS complemento             text,
  ADD COLUMN IF NOT EXISTS estado                  text,
  ADD COLUMN IF NOT EXISTS cidade                  text,
  ADD COLUMN IF NOT EXISTS bairro                  text,
  ADD COLUMN IF NOT EXISTS nome_responsavel        text,
  ADD COLUMN IF NOT EXISTS cargo_responsavel       text,
  ADD COLUMN IF NOT EXISTS rg_responsavel          text,
  ADD COLUMN IF NOT EXISTS cpf_responsavel         text,
  ADD COLUMN IF NOT EXISTS data_nascimento         date,
  ADD COLUMN IF NOT EXISTS email_responsavel       text,
  ADD COLUMN IF NOT EXISTS cartao_cnpj_url         text,
  ADD COLUMN IF NOT EXISTS comprovante_endereco_url text,
  ADD COLUMN IF NOT EXISTS doc_identificacao_url   text;

NOTIFY pgrst, 'reload schema';
