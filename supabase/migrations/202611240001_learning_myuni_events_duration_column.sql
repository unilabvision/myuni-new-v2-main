-- PROJE: Learning (kurs)  |  TABLO YAPISINI DEĞİŞTİRİR (Samet onaylı, 24.11.2026)
-- Amaç: Etkinlik sertifikası kodu myuni_events.duration kolonunu istiyor ama tabloda yok.
-- duration_minutes'tan otomatik hesaplanan, elle yazılamayan bir duration kolonu eklenir.
-- Örnek: 120 -> "2 saat", 90 -> "1 saat 30 dakika", 45 -> "45 dakika"
-- Geçicidir: kod düzeltilince 04_geri_alma.sql ile kaldırılır.
alter table public.myuni_events
  add column duration text
  generated always as (
    case
      when duration_minutes is null then null
      when duration_minutes < 60 then duration_minutes::text || ' dakika'
      when duration_minutes % 60 = 0 then (duration_minutes / 60)::text || ' saat'
      else (duration_minutes / 60)::text || ' saat '
           || (duration_minutes % 60)::text || ' dakika'
    end
  ) stored;

-- Supabase API katmanına yeni kolonu hemen tanıtır
notify pgrst, 'reload schema';
