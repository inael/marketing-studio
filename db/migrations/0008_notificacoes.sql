-- B39: avisos internos gerados pelo sistema (falha que pede acao, aviso informativo)
create table if not exists notificacoes (
  id bigserial primary key,
  tipo text not null check (tipo in ('acao','info')),
  titulo text not null,
  detalhe text,
  href text,
  lida boolean not null default false,
  created_at timestamptz not null default now()
);
