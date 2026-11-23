-- Referencias visuais por marca: imagens de estilo (5 a 10) e personagens com ficha visual (ate 10, 8 angulos cada)
create table if not exists referencias_estilo (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  url text not null,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists referencias_estilo_brand_idx on referencias_estilo (brand_id, ordem);

create table if not exists personagens (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  nome text not null,
  created_at timestamptz not null default now()
);
create index if not exists personagens_brand_idx on personagens (brand_id);

create table if not exists personagem_fotos (
  personagem_id uuid not null references personagens(id) on delete cascade,
  angulo text not null check (angulo in (
    'rosto_frente','rosto_perfil_esq','rosto_perfil_dir','rosto_diagonal',
    'corpo_frente','corpo_lateral_esq','corpo_lateral_dir','corpo_costas'
  )),
  url text not null,
  updated_at timestamptz not null default now(),
  primary key (personagem_id, angulo)
);
