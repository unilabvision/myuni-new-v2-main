begin;

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_id text not null unique,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  school text,
  grade text,
  bio text,
  phone_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_user_profiles_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
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
grant select, insert, update, delete on table public.user_profiles to service_role;

comment on table public.user_profiles is
  'Server-managed Clerk profile completion data. No direct anon/authenticated access.';

commit;
