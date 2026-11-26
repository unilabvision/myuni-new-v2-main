-- VERİTABANI: Learning  |  TABLO YAPISINI DEĞİŞTİRİR (yetki kuralları)
-- Amaç: "compat_temp_all" kuralı herkese açık anahtarla OKUMA + EKLEME + DEĞİŞTİRME + SİLME izni veriyor.
--   * Hiçbir kodda kullanılmayan tablolar: kural tamamen kaldırılır.
--     (myuni_edge_content, myuni_edge_data, myuni_edge_sections, myuni_videos_backup)
--   * myuni_kurum_course_lessons_user kullanıcıya bağlı kurumsal ders verisi taşır;
--     anonim/authenticated genel erişimine tamamen kapatılır.
-- ÖNKOŞUL: Bu tabloyu tarayıcıdan okuyan lms-2 sayfası sunucu API'sine taşınmalı.
-- Bu depoda tabloyu kullanan uygulama kodu yoktur (26.11.2026 kontrolü).
-- Tekrar çalıştırılabilir. Geri alma: 202611250900_close_compat_temp_all_rollback.sql
begin;

drop policy if exists compat_temp_all on public.myuni_edge_content;
drop policy if exists compat_temp_all on public.myuni_edge_data;
drop policy if exists compat_temp_all on public.myuni_edge_sections;
drop policy if exists compat_temp_all on public.myuni_videos_backup;

revoke all privileges on public.myuni_edge_content from public, anon, authenticated;
revoke all privileges on public.myuni_edge_data from public, anon, authenticated;
revoke all privileges on public.myuni_edge_sections from public, anon, authenticated;
revoke all privileges on public.myuni_videos_backup from public, anon, authenticated;

drop policy if exists compat_temp_all on public.myuni_kurum_course_lessons_user;
drop policy if exists compat_read_only on public.myuni_kurum_course_lessons_user;
revoke all privileges on public.myuni_kurum_course_lessons_user
  from public, anon, authenticated;

commit;
