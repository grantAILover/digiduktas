-- ============================================================
--  digiduktas — duomenų bazės schema
--  Paleisk Supabase → SQL Editor → New query → įklijuok → Run
--  (Saugu paleisti kelis kartus.)
-- ============================================================

-- ── 1. profiles (išplečia auth.users) ───────────────────────
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  display_name      text,
  avatar_url        text,
  bio               text,
  is_seller         boolean not null default false,
  is_admin          boolean not null default false,
  stripe_account_id text,               -- Stripe Connect (fazė 4)
  created_at        timestamptz not null default now()
);

-- ── Pagalbinė funkcija: ar naudotojas adminas? ──────────────
-- (Kuriama PO profiles lentelės, nes ja remiasi.)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Automatiškai sukurti profilį, kai užsiregistruoja naujas naudotojas
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 2. seller_applications ─────────────────────────────────
create table if not exists public.seller_applications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  full_name     text not null,
  about         text,
  portfolio_url text,
  status        text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected')),
  created_at    timestamptz not null default now(),
  reviewed_at   timestamptz
);

-- ── 3. products ─────────────────────────────────────────────
create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  seller_id       uuid not null references public.profiles(id) on delete cascade,
  title           text not null,
  slug            text not null unique,
  description     text,
  price_cents     integer not null check (price_cents >= 0),
  currency        text not null default 'eur',
  category        text,
  cover_image_url text,
  file_path       text,                 -- privati vieta Storage'e
  status          text not null default 'draft'
                    check (status in ('draft', 'pending', 'live', 'suspended', 'removed')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists products_status_idx   on public.products(status);
create index if not exists products_seller_idx   on public.products(seller_id);
create index if not exists products_category_idx on public.products(category);

-- ── 4. orders ───────────────────────────────────────────────
create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  buyer_id           uuid not null references public.profiles(id) on delete cascade,
  product_id         uuid not null references public.products(id) on delete restrict,
  price_cents        integer not null,
  platform_fee_cents integer not null default 0,
  seller_amount_cents integer not null default 0,
  status             text not null default 'pending'
                       check (status in ('pending', 'paid', 'refunded')),
  stripe_session_id  text,
  created_at         timestamptz not null default now()
);
create index if not exists orders_buyer_idx  on public.orders(buyer_id);
create index if not exists orders_product_idx on public.orders(product_id);

-- ── 5. downloads ────────────────────────────────────────────
create table if not exists public.downloads (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders(id) on delete cascade,
  token          text not null unique,
  expires_at     timestamptz not null,
  download_count integer not null default 0,
  created_at     timestamptz not null default now()
);

-- ── 6. reviews ──────────────────────────────────────────────
create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  buyer_id   uuid not null references public.profiles(id) on delete cascade,
  rating     integer not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz not null default now(),
  unique (product_id, buyer_id)
);
create index if not exists reviews_product_idx on public.reviews(product_id);

-- ── 7. reports ──────────────────────────────────────────────
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason      text not null,
  status      text not null default 'open' check (status in ('open', 'resolved')),
  created_at  timestamptz not null default now()
);

-- ============================================================
--  Row Level Security (RLS)
-- ============================================================
alter table public.profiles            enable row level security;
alter table public.seller_applications enable row level security;
alter table public.products            enable row level security;
alter table public.orders              enable row level security;
alter table public.downloads           enable row level security;
alter table public.reviews             enable row level security;
alter table public.reports             enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_admin_all"  on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_admin_all"  on public.profiles for all   using (public.is_admin());

drop policy if exists "apps_select_own" on public.seller_applications;
drop policy if exists "apps_insert_own" on public.seller_applications;
drop policy if exists "apps_admin_all"  on public.seller_applications;
create policy "apps_select_own" on public.seller_applications for select using (auth.uid() = user_id or public.is_admin());
create policy "apps_insert_own" on public.seller_applications for insert with check (auth.uid() = user_id);
create policy "apps_admin_all"  on public.seller_applications for all using (public.is_admin());

drop policy if exists "products_select_live" on public.products;
drop policy if exists "products_insert_own"  on public.products;
drop policy if exists "products_update_own"  on public.products;
drop policy if exists "products_admin_all"   on public.products;
create policy "products_select_live" on public.products for select using (status = 'live' or seller_id = auth.uid() or public.is_admin());
create policy "products_insert_own"  on public.products for insert with check (seller_id = auth.uid());
create policy "products_update_own"  on public.products for update using (seller_id = auth.uid());
create policy "products_admin_all"   on public.products for all using (public.is_admin());

drop policy if exists "orders_select_buyer"  on public.orders;
drop policy if exists "orders_select_seller" on public.orders;
drop policy if exists "orders_insert_buyer"  on public.orders;
drop policy if exists "orders_admin_all"     on public.orders;
create policy "orders_select_buyer"  on public.orders for select using (buyer_id = auth.uid());
create policy "orders_select_seller" on public.orders for select using (
  exists (select 1 from public.products p where p.id = orders.product_id and p.seller_id = auth.uid())
);
create policy "orders_insert_buyer"  on public.orders for insert with check (buyer_id = auth.uid());
create policy "orders_admin_all"     on public.orders for all using (public.is_admin());

drop policy if exists "downloads_select_buyer" on public.downloads;
drop policy if exists "downloads_admin_all"    on public.downloads;
create policy "downloads_select_buyer" on public.downloads for select using (
  exists (select 1 from public.orders o where o.id = downloads.order_id and o.buyer_id = auth.uid())
);
create policy "downloads_admin_all"    on public.downloads for all using (public.is_admin());

drop policy if exists "reviews_select_all"   on public.reviews;
drop policy if exists "reviews_insert_buyer" on public.reviews;
drop policy if exists "reviews_delete_own"   on public.reviews;
create policy "reviews_select_all"  on public.reviews for select using (true);
create policy "reviews_insert_buyer" on public.reviews for insert with check (
  buyer_id = auth.uid() and exists (
    select 1 from public.orders o
    where o.product_id = reviews.product_id and o.buyer_id = auth.uid() and o.status = 'paid'
  )
);
create policy "reviews_delete_own"  on public.reviews for delete using (buyer_id = auth.uid() or public.is_admin());

drop policy if exists "reports_insert_auth" on public.reports;
drop policy if exists "reports_admin_all"   on public.reports;
create policy "reports_insert_auth" on public.reports for insert with check (reporter_id = auth.uid());
create policy "reports_admin_all"   on public.reports for all using (public.is_admin());

-- ============================================================
--  Storage bucket'ai
-- ============================================================
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('product-files', 'product-files', false)
on conflict (id) do nothing;

drop policy if exists "covers_read_all"          on storage.objects;
drop policy if exists "covers_insert_auth"       on storage.objects;
drop policy if exists "productfiles_insert_own"  on storage.objects;
create policy "covers_read_all" on storage.objects for select using (bucket_id = 'covers');
create policy "covers_insert_auth" on storage.objects for insert to authenticated with check (bucket_id = 'covers');
create policy "productfiles_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-files' and (storage.foldername(name))[1] = auth.uid()::text);
