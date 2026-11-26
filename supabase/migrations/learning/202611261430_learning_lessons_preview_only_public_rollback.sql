-- VERİTABANI: Learning  |  3 Kasım haline döndürür (aktif kursların tüm aktif dersleri açık)
begin;
drop policy if exists public_read_preview_course_lessons on public.myuni_course_lessons;
drop policy if exists public_read_active_course_lessons on public.myuni_course_lessons;
create policy public_read_active_course_lessons
  on public.myuni_course_lessons for select to anon, authenticated
  using (
    is_active = true and exists (
      select 1
      from public.myuni_course_sections s
      join public.myuni_courses c on c.id = s.course_id
      where s.id = myuni_course_lessons.section_id
        and s.is_active = true and c.is_active = true
    )
  );
commit;
