-- VERİTABANI: Learning  |  202611250900_close_compat_temp_all.sql dosyasını GERİ ALIR
-- Eski, herkese tam yetki veren kuralları 25.11.2026'daki haliyle geri koyar.
begin;

drop policy if exists compat_read_only on public.myuni_kurum_course_lessons_user;

grant all privileges on public.myuni_edge_content to anon, authenticated;
grant all privileges on public.myuni_edge_data to anon, authenticated;
grant all privileges on public.myuni_edge_sections to anon, authenticated;
grant all privileges on public.myuni_videos_backup to anon, authenticated;
grant all privileges on public.myuni_kurum_course_lessons_user to anon, authenticated;

drop policy if exists compat_temp_all on public.myuni_edge_content;
create policy compat_temp_all on public.myuni_edge_content
  for all to anon, authenticated using (true) with check (true);
drop policy if exists compat_temp_all on public.myuni_edge_data;
create policy compat_temp_all on public.myuni_edge_data
  for all to anon, authenticated using (true) with check (true);
drop policy if exists compat_temp_all on public.myuni_edge_sections;
create policy compat_temp_all on public.myuni_edge_sections
  for all to anon, authenticated using (true) with check (true);
drop policy if exists compat_temp_all on public.myuni_videos_backup;
create policy compat_temp_all on public.myuni_videos_backup
  for all to anon, authenticated using (true) with check (true);
drop policy if exists compat_temp_all on public.myuni_kurum_course_lessons_user;
create policy compat_temp_all on public.myuni_kurum_course_lessons_user
  for all to anon, authenticated using (true) with check (true);

commit;
