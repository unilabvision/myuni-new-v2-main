-- VERİTABANI: Learning  |  GEÇİCİ duration KOLONUNU KALDIRIR
-- Ne zaman: kod duration_minutes kullanacak şekilde düzeltilip yayına alındıktan SONRA.
-- Negatif süre kuralı (myuni_events_duration_minutes_nonnegative) kalıcıdır, kaldırılmaz.
begin;
alter table public.myuni_events drop column if exists duration;
commit;
notify pgrst, 'reload schema';
