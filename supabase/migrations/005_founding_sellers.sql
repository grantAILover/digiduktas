-- ============================================================
--  005 — „Founding" pardavėjai: pirmos 20 vietų, 0 % komisijos iki 2027-06-30
--  Vieta rezervuojama užsiregistravus kaip pardavėjui (laukiančiųjų sąraše)
--  arba patvirtinus pardavėjo paraišką. Vienas žmogus (el. paštas) = viena vieta.
--  Saugu paleisti kelis kartus.
-- ============================================================

create table if not exists public.founding_slots (
  id         bigint generated always as identity primary key,
  email      text not null unique,
  user_id    uuid unique references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- RLS be taisyklių: lentelę pasiekia tik serveris (service-role)
alter table public.founding_slots enable row level security;

-- Atominis vietos skyrimas. Grąžina vietos numerį (1..limit) arba null, jei vietų nebėra.
-- Jei el. paštas ar vartotojas jau turi vietą — grąžina esamą (ir susieja vartotoją).
create or replace function public.claim_founding_slot(
  p_email   text,
  p_user_id uuid default null,
  p_limit   int  default 20
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id    bigint;
  v_taken int;
begin
  lock table public.founding_slots in share row exclusive mode;

  select id into v_id from public.founding_slots where email = lower(p_email);
  if v_id is null and p_user_id is not null then
    select id into v_id from public.founding_slots where user_id = p_user_id;
  end if;

  if v_id is not null then
    if p_user_id is not null then
      update public.founding_slots set user_id = p_user_id
        where id = v_id and user_id is null
          and not exists (select 1 from public.founding_slots where user_id = p_user_id);
    end if;
    return (select count(*) from public.founding_slots where id <= v_id);
  end if;

  select count(*) into v_taken from public.founding_slots;
  if v_taken >= p_limit then
    return null;
  end if;

  insert into public.founding_slots (email, user_id)
    values (lower(p_email), p_user_id)
    returning id into v_id;
  return v_taken + 1;
end;
$$;

revoke all on function public.claim_founding_slot(text, uuid, int) from public, anon, authenticated;

-- Jau užsiregistravę pardavėjai laukiančiųjų sąraše gauna vietas (registracijos tvarka)
insert into public.founding_slots (email, created_at)
select lower(email), created_at
from public.waitlist
where role in ('seller', 'both')
order by created_at
limit 20
on conflict (email) do nothing;
