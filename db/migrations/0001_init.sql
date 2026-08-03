create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nome text not null,
  cor_principal text, cor_apoio text[] default '{}',
  fonte text, tom_voz text,
  ig_user_id text, ig_token text,
  linkedin_org_id text, linkedin_token text,
  site_url text, ativo boolean default true,
  created_at timestamptz default now()
);
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id),
  tipo text not null check (tipo in ('carousel','image','reel')),
  formato text not null check (formato in ('com_personagem','sem_personagem','demo_ui')),
  legenda text default '', hashtags text[] default '{}',
  media text[] default '{}',
  scheduled_at timestamptz,
  status text not null default 'draft' check (status in ('draft','approved','scheduled','published','failed')),
  aprovado_por text, aprovado_em timestamptz,
  external_url text, erro text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id), tipo text, url text not null,
  origem text, meta jsonb default '{}', created_at timestamptz default now()
);
create table if not exists publish_logs (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id), rede text, status text,
  external_id text, erro text, ts timestamptz default now()
);
