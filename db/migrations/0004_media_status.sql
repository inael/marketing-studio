-- B05: estado da midia no envio direto (enviando -> pronta | falhou)
alter table media_assets add column if not exists status text not null default 'pronta';
alter table media_assets add column if not exists key text;
alter table media_assets add column if not exists mime text;
alter table media_assets add column if not exists size_bytes bigint;
