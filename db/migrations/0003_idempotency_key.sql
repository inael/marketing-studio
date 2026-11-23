-- B04: chave de idempotencia por intencao de criar. Clique duplo ou reenvio nao duplica o post.
alter table posts add column if not exists idempotency_key text;
create unique index if not exists posts_idempotency_key_uq on posts (idempotency_key) where idempotency_key is not null;
