-- B09: fuso da marca. O horario agendado vira UTC na gravacao; o fuso fica guardado junto.
alter table brands add column if not exists timezone text not null default 'America/Sao_Paulo';
alter table posts add column if not exists timezone_marca text;
