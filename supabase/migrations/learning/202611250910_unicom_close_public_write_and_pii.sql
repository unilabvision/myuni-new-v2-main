-- VERİTABANI: Learning  |  TABLO YAPISINI DEĞİŞTİRİR (yetki kuralları)  |  SAMET KARARI GEREKİR
-- Amaç: Unicom (pasif site) tablolarında herkese açık anahtarla yapılabilen
--   kişisel veri okuma/değiştirme ve kayıt silme işlemlerini kapatmak.
--   Herkese açık içerik (etkinlik, ana sayfa, oturum, aktif sponsor, konular) OKUNMAYA devam eder.
--   Yeni katılımcı kaydı (insert) açık bırakılır; site yeniden açılırsa kayıt formu çalışır.
-- Kod etkisi: bu depolarda Unicom kodu yok. Unicom sitesi şu an pasif.
-- Tekrar çalıştırılabilir. Geri alma: 202611250910_unicom_close_public_write_and_pii_rollback.sql
begin;

-- 1) Kişisel veriler: 259 kişinin ad, telefon, kurum bilgisi
drop policy if exists "public can select user data" on public.unicom_user_data;
drop policy if exists "public can update user data" on public.unicom_user_data;

-- 2) Sponsorlar: herkes ekleyip/değiştirip/silebiliyordu
drop policy if exists unicom_sponsors_insert_all on public.unicom_sponsors;
drop policy if exists unicom_sponsors_update_all on public.unicom_sponsors;
drop policy if exists unicom_sponsors_delete_all on public.unicom_sponsors;
drop policy if exists unicom_sponsors_select_all on public.unicom_sponsors;
-- "Allow public read active sponsors" (yalnızca aktif sponsorları okuma) kalır.

-- 3) Kayıt ve yoklama listeleri (kişi bazlı veri): herkese açık okuma/yazma kapanır
drop policy if exists "public can select enrollments for checks" on public.unicom_event_enrollments;
drop policy if exists compat_temp_all on public.unicom_event_enrollments_attendance;
drop policy if exists compat_temp_all on public.unicom_event_sessions_attendance;

-- 4) Herkese açık içerik: tam yetki yerine yalnızca okuma
drop policy if exists compat_temp_all on public.unicom_events;
drop policy if exists compat_read_only on public.unicom_events;
create policy compat_read_only on public.unicom_events
  for select to anon, authenticated using (true);

drop policy if exists compat_temp_all on public.unicom_home;
drop policy if exists compat_read_only on public.unicom_home;
create policy compat_read_only on public.unicom_home
  for select to anon, authenticated using (true);

drop policy if exists compat_temp_all on public.unicom_event_sessions;
drop policy if exists compat_read_only on public.unicom_event_sessions;
create policy compat_read_only on public.unicom_event_sessions
  for select to anon, authenticated using (true);

commit;
