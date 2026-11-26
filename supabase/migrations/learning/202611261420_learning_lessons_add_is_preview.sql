-- VERİTABANI: Learning  |  HEMEN UYGULANABİLİR (kod değişikliği gerekmez)
-- Samet madde 4: "anonim kullanıcılar yalnızca açık önizleme derslerini görebilmeli".
--   Ders tablosunda önizleme alanı yoktu; bu dosya yalnızca alanı ekler (varsayılan: false).
--   Erişim kuralı değişmez. Kuralı değiştiren dosya: 202611261430 (önkoşullu).
-- Sonrasında: hangi derslerin önizleme olacağı panelden/SQL ile işaretlenmeli.
-- Tekrar çalıştırılabilir  |  Geri alma: _rollback dosyası
begin;
alter table public.myuni_course_lessons
  add column if not exists is_preview boolean not null default false;
create index if not exists myuni_course_lessons_preview_idx
  on public.myuni_course_lessons (section_id) where is_preview;
commit;
notify pgrst, 'reload schema';
