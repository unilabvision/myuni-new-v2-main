-- VERİTABANI: Learning  |  HEMEN UYGULANABİLİR (kod değişikliği gerekmez)
-- Samet madde 4: yorumlar yalnızca onaylıysa VE bağlı kurs aktifse görünsün.
-- Önce: _policy_snapshot.sql  |  Tekrar çalıştırılabilir  |  Geri alma: _rollback dosyası
begin;
drop policy if exists public_read_approved_course_comments on public.myuni_comments;
create policy public_read_approved_course_comments
  on public.myuni_comments for select to anon, authenticated
  using (
    status = 'approved'
    and exists (
      select 1 from public.myuni_courses c
      where c.id = myuni_comments.course_id and c.is_active = true
    )
  );
commit;
