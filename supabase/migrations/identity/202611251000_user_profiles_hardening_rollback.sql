-- VERİTABANI: Identity  |  202611251000_user_profiles_hardening.sql dosyasını GERİ ALIR
-- Yalnızca bu dosyanın eklediği büyük/küçük harf duyarsız e-posta kuralını kaldırır.
-- Eklenen kolonlar (if not exists) mevcutta zaten vardı; veri kaybı olmaması için kaldırılmaz.
begin;
drop index if exists public.user_profiles_email_lower_key;
commit;
