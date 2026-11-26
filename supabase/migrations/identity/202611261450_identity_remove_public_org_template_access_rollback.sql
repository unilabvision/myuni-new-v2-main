-- VERİTABANI: Identity  |  25.11.2026'daki haline döndürür
begin;
do $$
begin
  if to_regclass('public.user_profiles') is null
     or to_regclass('public.organizations') is null
     or to_regclass('public.certificate_templates') is null
     or to_regclass('public.user_module_access') is null then
    raise exception 'Yanlis Identity hedefi';
  end if;
end $$;

grant all privileges on public.organizations to anon, authenticated;
grant all privileges on public.certificate_templates to anon, authenticated;
grant all privileges on public.user_module_access to anon, authenticated;

drop policy if exists public_read_organizations on public.organizations;
create policy public_read_organizations on public.organizations
  for select to anon, authenticated using (true);
drop policy if exists public_read_certificate_templates on public.certificate_templates;
create policy public_read_certificate_templates on public.certificate_templates
  for select to anon, authenticated using (true);
drop policy if exists allow_read_user_module_access on public.user_module_access;
create policy allow_read_user_module_access on public.user_module_access
  for select to anon, authenticated using (true);
commit;
