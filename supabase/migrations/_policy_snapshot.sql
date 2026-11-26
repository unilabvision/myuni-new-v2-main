-- HER VERİTABANINDA, HER POLİTİKA MİGRATION'INDAN ÖNCE ÇALIŞTIRIN  |  SADECE OKUR
-- Mevcut tüm RLS politikalarını "create policy" komutu olarak listeler.
-- Sonucu CSV olarak saklayın: geri almada politikaların birebir eski hali buradan geri yüklenir.
select format(
  'create policy %I on %I.%I as %s for %s to %s%s%s;',
  policyname, schemaname, tablename, permissive, cmd,
  array_to_string(roles, ', '),
  coalesce(' using (' || qual || ')', ''),
  coalesce(' with check (' || with_check || ')', '')
) as politika
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
