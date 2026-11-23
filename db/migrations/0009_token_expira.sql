-- B21: validade do token de longa duracao do Instagram (renovado antes de vencer)
alter table brands add column if not exists ig_token_expira_em timestamptz;
