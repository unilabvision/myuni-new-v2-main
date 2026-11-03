begin;

drop policy if exists public_read_active_products on public.myuni_products;
create policy public_read_active_products
on public.myuni_products for select to anon, authenticated
using (is_active = true);

drop policy if exists public_read_organizations on public.organizations;
create policy public_read_organizations
on public.organizations for select to anon, authenticated
using (true);

drop policy if exists public_read_certificate_templates on public.certificate_templates;
create policy public_read_certificate_templates
on public.certificate_templates for select to anon, authenticated
using (true);

commit;
