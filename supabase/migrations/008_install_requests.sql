-- 008: Diegimo anketos („Su įdiegimu" pirkėjams). Paleisti Supabase → SQL Editor PRIEŠ deploy'ą.
-- Viena anketa vienam užsakymui. Prieiga TIK per serverį (service-role) — serveris pats
-- tikrina, kad užsakymas priklauso pirkėjui; todėl RLS įjungtas be jokių taisyklių.

create table if not exists public.install_requests (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null unique references public.orders(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  email          text,
  phone          text not null,
  preferred_time text not null,
  os             text not null check (os in ('windows', 'mac', 'kita')),
  tools          text,
  notes          text,
  status         text not null default 'naujas'
                   check (status in ('naujas', 'suderinta', 'idiegta')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists install_requests_status_idx on public.install_requests(status);

alter table public.install_requests enable row level security;
