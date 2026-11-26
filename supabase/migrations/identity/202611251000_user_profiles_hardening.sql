-- VERİTABANI: Identity  |  TABLO YAPISINI DEĞİŞTİRİR  |  ÖNCE ön kontrol sorgusunu çalıştırın
-- Amaç (Samet'in 1. maddesi):
--   * Tablo zaten varsa eksik kolonlar eklensin.
--   * E-posta büyük/küçük harften bağımsız tekil olsun.
--   * updated_at kolonu trigger'dan önce var olsun.
--   * Tablo tarayıcıdan doğrudan erişime kapalı kalsın.
-- ÖN KONTROL (sonuç BOŞ olmalı, değilse durun):
--   select lower(email), count(*) from public.user_profiles group by 1 having count(*) > 1;
-- Tekrar çalıştırılabilir. Geri alma: 202611251000_user_profiles_hardening_rollback.sql
begin;

alter table public.user_profiles add column if not exists school text;
alter table public.user_profiles add column if not exists grade text;
alter table public.user_profiles add column if not exists bio text;
alter table public.user_profiles add column if not exists phone_number text;
alter table public.user_profiles add column if not exists created_at timestamptz not null default now();
alter table public.user_profiles add column if not exists updated_at timestamptz not null default now();

create unique index if not exists user_profiles_email_lower_key
  on public.user_profiles (lower(email));

create or replace function public.set_user_profiles_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
  before update on public.user_profiles
  for each row execute function public.set_user_profiles_updated_at();

alter table public.user_profiles enable row level security;
revoke all on table public.user_profiles from anon, authenticated;

commit;
