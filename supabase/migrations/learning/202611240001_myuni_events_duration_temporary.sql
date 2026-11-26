-- VERİTABANI: Learning  |  24.11.2026'DA CANLIDA UYGULANDI (Samet onayıyla)
-- Amaç: Etkinlik sertifikası kodu (lib/certificateService.ts:977, app/api/certificates/generate/route.ts:35)
--   myuni_events.duration kolonunu istiyor ama tabloda yalnızca duration_minutes var.
-- GEÇİCİDİR: Kod duration_minutes'tan okuyup metni dile göre üretecek şekilde düzeltilince
--   _rollback dosyasıyla kaldırılacak. Kalıcı yapıda veritabanında yalnızca dakika tutulur.
-- Tekrar çalıştırılabilir (if not exists). Negatif süre girişi engellenir.
begin;

alter table public.myuni_events
  add column if not exists duration text
  generated always as (
    case
      when duration_minutes is null then null
      when duration_minutes < 60 then duration_minutes::text || ' dakika'
      when duration_minutes % 60 = 0 then (duration_minutes / 60)::text || ' saat'
      else (duration_minutes / 60)::text || ' saat '
           || (duration_minutes % 60)::text || ' dakika'
    end
  ) stored;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'myuni_events_duration_minutes_nonnegative'
      and conrelid = 'public.myuni_events'::regclass
  ) then
    alter table public.myuni_events
      add constraint myuni_events_duration_minutes_nonnegative
      check (duration_minutes is null or duration_minutes >= 0);
  end if;
end $$;

commit;
notify pgrst, 'reload schema';
