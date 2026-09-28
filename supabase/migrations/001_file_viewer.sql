-- ============================================================
--  001 — Failų peržiūra naršyklėje
--  • products.allow_download (ar pirkėjas gali atsisiųsti failą)
--  • product_files — keli failai vienam produktui (pvz. audio knygos skyriai)
--  • playback_progress — pirkėjo klausymo/žiūrėjimo pozicija
--  Saugu paleisti kelis kartus. Senas kodas toliau veikia (products.file_path lieka).
-- ============================================================

-- ── 1. Leidimas atsisiųsti ──────────────────────────────────
alter table public.products
  add column if not exists allow_download boolean not null default true;

-- ── 2. Produkto failai ──────────────────────────────────────
create table if not exists public.product_files (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references public.products(id) on delete cascade,
  storage_path     text not null,            -- vieta privačiame 'product-files' bucket'e
  file_name        text not null,            -- rodomas pirkėjui / atsisiuntimo pavadinimas
  mime_type        text,
  size_bytes       bigint,
  kind             text not null default 'other'
                     check (kind in ('pdf', 'audio', 'video', 'other')),
  position         integer not null default 0,  -- tvarka (skyriai)
  duration_seconds integer,
  -- Ateičiai: video per Bunny Stream / Cloudflare Stream (HLS)
  stream_provider  text check (stream_provider in ('bunny', 'cloudflare')),
  stream_ref       text,
  created_at       timestamptz not null default now()
);
create index if not exists product_files_product_idx
  on public.product_files(product_id, position);

-- ── 3. Klausymo pozicija ────────────────────────────────────
create table if not exists public.playback_progress (
  user_id          uuid not null references public.profiles(id) on delete cascade,
  product_file_id  uuid not null references public.product_files(id) on delete cascade,
  product_id       uuid not null references public.products(id) on delete cascade,
  position_seconds numeric not null default 0 check (position_seconds >= 0),
  updated_at       timestamptz not null default now(),
  primary key (user_id, product_file_id)
);
create index if not exists playback_progress_user_product_idx
  on public.playback_progress(user_id, product_id);

-- ── 4. Esamų failų perkėlimas (products.file_path → product_files) ──
insert into public.product_files (product_id, storage_path, file_name, kind, position)
select
  p.id,
  p.file_path,
  regexp_replace(p.file_path, '^[^/]*/[0-9a-f-]{36}-', ''),
  case
    when lower(p.file_path) ~ '\.pdf$'             then 'pdf'
    when lower(p.file_path) ~ '\.(mp3|m4a|aac)$'   then 'audio'
    when lower(p.file_path) ~ '\.(mp4|webm|m4v)$'  then 'video'
    else 'other'
  end,
  0
from public.products p
where p.file_path is not null
  and not exists (select 1 from public.product_files f where f.product_id = p.id);

-- ── 5. RLS ──────────────────────────────────────────────────
alter table public.product_files     enable row level security;
alter table public.playback_progress enable row level security;

-- Failų kelius mato/keičia tik savininkas ir adminas.
-- Pirkėjai prieigą gauna TIK per serverio endpoint'ą (trumpa pasirašyta nuoroda).
drop policy if exists "product_files_owner_all" on public.product_files;
drop policy if exists "product_files_admin_all" on public.product_files;
create policy "product_files_owner_all" on public.product_files for all
  using (exists (select 1 from public.products p where p.id = product_files.product_id and p.seller_id = auth.uid()))
  with check (exists (select 1 from public.products p where p.id = product_files.product_id and p.seller_id = auth.uid()));
create policy "product_files_admin_all" on public.product_files for all using (public.is_admin());

drop policy if exists "playback_progress_own" on public.playback_progress;
create policy "playback_progress_own" on public.playback_progress for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
