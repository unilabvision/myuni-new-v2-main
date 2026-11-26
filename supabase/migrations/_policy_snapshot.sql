-- HER VERİTABANINDA, HER POLİTİKA MİGRATION'INDAN ÖNCE ÇALIŞTIRIN  |  SADECE OKUR
-- Mevcut tüm RLS politikalarını yeniden çalıştırılabilir SQL olarak listeler.
-- Her satır önce aynı adlı politikayı kaldırır; bu sayede rollback sırasında
-- migration'ın oluşturduğu politika ile isim çakışması yaşanmaz.
-- Sonucu CSV olarak saklayın. Bu snapshot yalnızca policy tanımlarını kapsar;
-- GRANT/REVOKE değişiklikleri ilgili migration'ın rollback dosyasında tutulur.
select format(
  'drop policy if exists %I on %I.%I;%screate policy %I on %I.%I as %s for %s to %s%s%s;',
  policyname, schemaname, tablename, chr(10),
  policyname, schemaname, tablename, permissive, cmd,
  (
    select string_agg(format('%I', role_name), ', ' order by role_name)
    from unnest(roles) as role_name
  ),
  coalesce(' using (' || qual || ')', ''),
  coalesce(' with check (' || with_check || ')', '')
) as restore_sql
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
