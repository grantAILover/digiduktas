-- ============================================================
--  006 — Pardavėjo kontaktas laukiančiųjų sąraše (Instagram arba telefonas)
--  Kad būtų galima susisiekti asmeniškai. Saugu paleisti kelis kartus.
-- ============================================================

alter table public.waitlist
  add column if not exists contact text;
