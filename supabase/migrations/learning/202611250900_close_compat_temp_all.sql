-- VERİTABANI: Learning  |  TABLO YAPISINI DEĞİŞTİRİR (yetki kuralları)
-- Amaç: "compat_temp_all" kuralı herkese açık anahtarla OKUMA + EKLEME + DEĞİŞTİRME + SİLME izni veriyor.
--   * Hiçbir kodda kullanılmayan tablolar: kural tamamen kaldırılır.
--     (myuni_edge_content, myuni_edge_data, myuni_edge_sections, myuni_videos_backup)
--   * myuni_kurum_course_lessons_user: admin paneli (lms-2) tarayıcıdan OKUYOR, yazmıyor.
--     Bu yüzden yalnızca okuma izni bırakılır, yazma/silme kapatılır.
-- Kod etkisi: yok (25.11.2026 kod incelemesi).
-- Tekrar çalıştırılabilir. Geri alma: 202611250900_close_compat_temp_all_rollback.sql
begin;

drop policy if exists compat_temp_all on public.myuni_edge_content;
drop policy if exists compat_temp_all on public.myuni_edge_data;
drop policy if exists compat_temp_all on public.myuni_edge_sections;
drop policy if exists compat_temp_all on public.myuni_videos_backup;

drop policy if exists compat_temp_all on public.myuni_kurum_course_lessons_user;
drop policy if exists compat_read_only on public.myuni_kurum_course_lessons_user;
create policy compat_read_only
  on public.myuni_kurum_course_lessons_user
  for select to anon, authenticated
  using (true);

commit;
