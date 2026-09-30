-- ============================================================
--  003 — Laukiančiųjų sąrašas: pardavėjų informacija, pakvietimai, šaltinis
--  Saugu paleisti kelis kartus.
-- ============================================================

alter table public.waitlist
  add column if not exists seller_type   text,  -- mokytojas | korepetitorius | abiturientas | kita
  add column if not exists wants_to_sell text,  -- ką norėtų parduoti (laisvas tekstas)
  add column if not exists ref_code      text,  -- asmeninis pakvietimo kodas (?ref=...)
  add column if not exists referred_by   text,  -- kieno kodu atėjo
  add column if not exists utm_source    text,  -- iš kur atėjo (tiktok, instagram, klase...)
  add column if not exists utm_medium    text,
  add column if not exists utm_campaign  text,
  add column if not exists referrer      text;  -- svetainė, iš kurios atėjo

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'waitlist_seller_type_check') then
    alter table public.waitlist add constraint waitlist_seller_type_check
      check (seller_type is null or seller_type in ('mokytojas', 'korepetitorius', 'abiturientas', 'kita'));
  end if;
end $$;

create unique index if not exists waitlist_ref_code_uidx
  on public.waitlist(ref_code) where ref_code is not null;
create index if not exists waitlist_referred_by_idx on public.waitlist(referred_by);

-- Esamiems įrašams — pakvietimo kodai
update public.waitlist
  set ref_code = substr(md5(random()::text || id::text), 1, 8)
  where ref_code is null;
