-- B10: registro de cada mudanca de estado do post (de, para, quem, quando, motivo)
create table if not exists post_status_log (
  id bigserial primary key,
  post_id uuid not null references posts(id) on delete cascade,
  de text not null,
  para text not null,
  quem text,
  motivo text,
  created_at timestamptz not null default now()
);
alter table posts add column if not exists status_changed_at timestamptz;
