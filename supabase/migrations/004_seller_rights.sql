-- ============================================================
--  004 — Pardavėjo patvirtinimas dėl teisių į turinį
--  Kada pardavėjas patvirtino, kad turinys jo sukurtas arba jis turi teisę jį parduoti.
--  Saugu paleisti kelis kartus.
-- ============================================================

alter table public.products
  add column if not exists rights_confirmed_at timestamptz;
