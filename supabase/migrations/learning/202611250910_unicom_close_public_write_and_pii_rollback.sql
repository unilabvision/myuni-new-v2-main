-- VERİTABANI: Learning  |  202611250910_unicom_close_public_write_and_pii.sql dosyasını GERİ ALIR
-- Kuralları 25.11.2026'daki haliyle geri koyar.
-- Not: unicom_user_data ve unicom_event_enrollments kurallarının eski koşulları "true" idi.
begin;

grant select, update, delete, truncate on public.unicom_user_data
  to anon, authenticated;
grant insert, update, delete, truncate on public.unicom_sponsors
  to anon, authenticated;
grant select, update, delete, truncate on public.unicom_event_enrollments
  to anon, authenticated;
grant all privileges on public.unicom_event_enrollments_attendance
  to anon, authenticated;
grant all privileges on public.unicom_event_sessions_attendance
  to anon, authenticated;
grant insert, update, delete, truncate on public.unicom_events
  to anon, authenticated;
grant insert, update, delete, truncate on public.unicom_home
  to anon, authenticated;
grant insert, update, delete, truncate on public.unicom_event_sessions
  to anon, authenticated;

drop policy if exists "public can select user data" on public.unicom_user_data;
create policy "public can select user data" on public.unicom_user_data
  for select to public using (true);
drop policy if exists "public can update user data" on public.unicom_user_data;
create policy "public can update user data" on public.unicom_user_data
  for update to public using (true);

drop policy if exists unicom_sponsors_insert_all on public.unicom_sponsors;
create policy unicom_sponsors_insert_all on public.unicom_sponsors
  for insert to anon with check (true);
drop policy if exists unicom_sponsors_update_all on public.unicom_sponsors;
create policy unicom_sponsors_update_all on public.unicom_sponsors
  for update to anon using (true);
drop policy if exists unicom_sponsors_delete_all on public.unicom_sponsors;
create policy unicom_sponsors_delete_all on public.unicom_sponsors
  for delete to anon using (true);
drop policy if exists unicom_sponsors_select_all on public.unicom_sponsors;
create policy unicom_sponsors_select_all on public.unicom_sponsors
  for select to anon using (true);

drop policy if exists "public can select enrollments for checks" on public.unicom_event_enrollments;
create policy "public can select enrollments for checks" on public.unicom_event_enrollments
  for select to public using (true);

drop policy if exists compat_temp_all on public.unicom_event_enrollments_attendance;
create policy compat_temp_all on public.unicom_event_enrollments_attendance
  for all to anon, authenticated using (true) with check (true);
drop policy if exists compat_temp_all on public.unicom_event_sessions_attendance;
create policy compat_temp_all on public.unicom_event_sessions_attendance
  for all to anon, authenticated using (true) with check (true);

drop policy if exists compat_read_only on public.unicom_events;
drop policy if exists compat_temp_all on public.unicom_events;
create policy compat_temp_all on public.unicom_events
  for all to anon, authenticated using (true) with check (true);
drop policy if exists compat_read_only on public.unicom_home;
drop policy if exists compat_temp_all on public.unicom_home;
create policy compat_temp_all on public.unicom_home
  for all to anon, authenticated using (true) with check (true);
drop policy if exists compat_read_only on public.unicom_event_sessions;
drop policy if exists compat_temp_all on public.unicom_event_sessions;
create policy compat_temp_all on public.unicom_event_sessions
  for all to anon, authenticated using (true) with check (true);

commit;
