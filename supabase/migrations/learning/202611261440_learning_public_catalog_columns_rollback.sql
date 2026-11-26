-- VERİTABANI: Learning  |  Kolon kısıtlarını kaldırır, tablo okuma iznini geri verir
begin;
grant select on public.myuni_courses to anon, authenticated;
grant select on public.myuni_course_tiers to anon, authenticated;
grant select on public.myuni_packages to anon, authenticated;
grant select on public.myuni_opportunities to anon, authenticated;
commit;
notify pgrst, 'reload schema';
