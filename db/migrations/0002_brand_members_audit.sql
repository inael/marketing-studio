-- B03: quem pode mexer em cada marca (papel por marca) e registro das tentativas
create table if not exists brand_members (
  user_id text not null,
  brand_id uuid not null references brands(id) on delete cascade,
  role text not null check (role in ('gestor','analista')),
  primary key (user_id, brand_id)
);

create table if not exists audit_log (
  id bigserial primary key,
  user_id text,
  brand_id uuid,
  rota text not null,
  resultado text not null,
  created_at timestamptz not null default now()
);
