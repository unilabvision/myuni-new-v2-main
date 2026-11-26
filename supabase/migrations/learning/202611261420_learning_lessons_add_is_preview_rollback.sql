-- VERİTABANI: Learning  |  202611261420 dosyasını geri alır
-- DİKKAT: 202611261430 uygulandıysa önce onu geri alın.
begin;
drop index if exists public.myuni_course_lessons_preview_idx;
alter table public.myuni_course_lessons drop column if exists is_preview;
commit;
notify pgrst, 'reload schema';
