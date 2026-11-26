-- VERİTABANI: Learning  |  3 Kasım haline döndürür
begin;
drop policy if exists public_read_approved_course_comments on public.myuni_comments;
create policy public_read_approved_course_comments
  on public.myuni_comments for select to anon, authenticated
  using (status = 'approved');
commit;
