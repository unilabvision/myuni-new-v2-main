-- VERİTABANI: Learning  |  202611050001_learning_public_event_policy.sql dosyasını GERİ ALIR
-- Migration öncesinde myuni_events için public okuma policy'si yoktu.
begin;
drop policy if exists public_read_active_events on public.myuni_events;
commit;
