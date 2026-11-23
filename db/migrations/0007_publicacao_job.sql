-- B11/B16: trava do job, tentativas, proxima tentativa e classificacao do erro
alter table posts add column if not exists attempts integer not null default 0;
alter table posts add column if not exists next_attempt_at timestamptz;
alter table posts add column if not exists last_error text;
alter table posts add column if not exists error_kind text;
alter table posts add column if not exists locked_until timestamptz;
