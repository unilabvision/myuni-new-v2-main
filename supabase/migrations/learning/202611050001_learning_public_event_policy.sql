-- VERİTABANI: Learning  |  05.11.2026'DA CANLIDA UYGULANDI
-- Etkinlik kataloğu Learning projesine taşındığında public event policy eksik kalmıştı.
-- Yalnızca aktif etkinlikler anonim ve oturum açmış ziyaretçilere gösterilir.
-- Tekrar çalıştırılabilir  |  Geri alma: _rollback dosyası
begin;

drop policy if exists public_read_active_events on public.myuni_events;
create policy public_read_active_events
  on public.myuni_events for select to anon, authenticated
  using (is_active = true);

commit;
