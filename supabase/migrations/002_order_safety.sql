-- ============================================================
--  002 — Užsakymų patikimumas
--  • Unikali Stripe sesija: webhook'as ir grįžimo puslapis gali
--    „įvykdyti" užsakymą vienu metu — sukuriamas tik vienas.
--  • stripe_payment_intent: grąžinus pinigus Stripe'e rasti užsakymą
--    ir atimti prieigą.
--  Saugu paleisti kelis kartus.
-- ============================================================

alter table public.orders
  add column if not exists stripe_payment_intent text;

create unique index if not exists orders_stripe_session_uidx
  on public.orders(stripe_session_id)
  where stripe_session_id is not null;

create index if not exists orders_payment_intent_idx
  on public.orders(stripe_payment_intent);
