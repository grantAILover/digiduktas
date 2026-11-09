-- 010: Plugino informacija. Paleisti Supabase → SQL Editor PRIEŠ deploy'ą.
--   products.requirements — reikalavimai (viešai, plugino puslapyje prieš pirkimą)
--   products.demo_url     — demo vaizdo įrašo nuoroda (YouTube, Loom ir pan.)
--   product_guides        — diegimo instrukcija TIK pirkėjams. Atskira lentelė, nes
--                           products skaitomi viešai; čia RLS be taisyklių — skaito tik serveris,
--                           patikrinęs, kad vartotojas pluginą nusipirko.

alter table public.products add column if not exists requirements text;
alter table public.products add column if not exists demo_url     text;

create table if not exists public.product_guides (
  product_id    uuid primary key references public.products(id) on delete cascade,
  install_guide text not null,
  updated_at    timestamptz not null default now()
);

alter table public.product_guides enable row level security;
