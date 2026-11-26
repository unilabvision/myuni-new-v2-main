-- VERİTABANI: Learning  |  ÖNKOŞULLU: KOD DEĞİŞMEDEN UYGULAMAYIN
-- Samet madde 4: anonim kullanıcılar yalnızca önizleme derslerini görebilsin;
--   ücretli/kilitli/kayıtlıya özel dersler korunsun.
-- ÖNKOŞULLAR (Samet'in ekibi):
--   1) Site lib/courseService.ts:201 kurs süresini myuni_course_lessons(duration_minutes)
--      üzerinden herkese açık anahtarla topluyor. Bu kuraldan sonra yalnızca önizleme
--      dersleri sayılır. Süre sunucu API'sinden (gizli anahtar) hesaplanmalı.
--   2) Admin paneli şu sayfalarda dersleri tarayıcıdan okuyor, sunucu API'sine taşınmalı:
--      app/[locale]/lms/edit/[id], app/[locale]/lms-2/edit/[id], app/[locale]/lms/progress
--   3) app/api/public/lessons/[lessonId]/preview yalnızca is_preview = true dersler için
--      Vimeo bilgisi döndürmeli (şu an her ders için döndürüyor).
--   4) 202611261420 uygulanmış ve önizleme dersleri işaretlenmiş olmalı.
-- Not: myuni_videos, myuni_notes, myuni_quicks için Learning'de herkese açık kural YOK (kontrol: 25.11.2026).
-- Önce: _policy_snapshot.sql  |  Tekrar çalıştırılabilir  |  Geri alma: _rollback dosyası
begin;
drop policy if exists public_read_active_course_lessons on public.myuni_course_lessons;
drop policy if exists public_read_preview_course_lessons on public.myuni_course_lessons;
create policy public_read_preview_course_lessons
  on public.myuni_course_lessons for select to anon, authenticated
  using (
    is_active = true and is_preview = true and exists (
      select 1
      from public.myuni_course_sections s
      join public.myuni_courses c on c.id = s.course_id
      where s.id = myuni_course_lessons.section_id
        and s.is_active = true and c.is_active = true
    )
  );
commit;
