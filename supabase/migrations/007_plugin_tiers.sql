-- 007: Pluginų lygiai. Paleisti Supabase → SQL Editor PRIEŠ deploy'ą.
--   products.install_price_cents — kaina „Su įdiegimu" (NULL = šis lygis nesiūlomas)
--   orders.tier                  — kurį lygį pirkėjas nusipirko

alter table public.products
  add column if not exists install_price_cents integer
    check (install_price_cents is null or install_price_cents >= 0);

alter table public.orders
  add column if not exists tier text not null default 'self'
    check (tier in ('self', 'install'));
