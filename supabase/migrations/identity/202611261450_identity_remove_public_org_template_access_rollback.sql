-- VERİTABANI: Identity  |  25.11.2026'daki haline döndürür
begin;
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
