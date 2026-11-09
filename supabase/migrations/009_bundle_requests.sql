-- 009: Komplekto (kelių pluginų kartu) užklausos. Paleisti Supabase → SQL Editor PRIEŠ deploy'ą.
-- Forma vieša (prisijungti nereikia). Prieiga TIK per serverį (service-role) — RLS be taisyklių.

create table if not exists public.bundle_requests (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete set null,
  name       text not null,
  email      text not null,
  phone      text,
  plugins    text[] not null default '{}',   -- dominančių pluginų pavadinimai
  message    text not null,                  -- ką nori automatizuoti
  status     text not null default 'naujas'
               check (status in ('naujas', 'atsakyta', 'uzdaryta')),
  created_at timestamptz not null default now()
);

create index if not exists bundle_requests_status_idx on public.bundle_requests(status);

alter table public.bundle_requests enable row level security;
