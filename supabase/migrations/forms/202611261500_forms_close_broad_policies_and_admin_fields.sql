-- VERİTABANI: Forms  |  ÖNKOŞULLU: KOD DEĞİŞMEDEN UYGULAMAYIN
-- Samet madde 2: formların yönetimsel alanları ve dahili ayarları dışarı açılmasın, public
--   tarafta yalnızca gereken alanlar görünsün, form alanları yalnızca form aktif ve
--   yayındaysa erişilebilsin, tüm tablolarda RLS doğrulansın.
--   * Herkese tam yetki veren eski geniş kurallar (varsa) kaldırılır. "Service role full access"
--     adlı kurallar aslında HERKESE açıktır; gizli anahtar RLS'e takılmadığı için gereksizdir.
--   * Başvuru GÖNDERME (insert) kuralları korunur: form gönderimi çalışmaya devam eder.
--   * myuni_site_application_forms: created_by, created_by_email gizlenir.
--   * mentorships: created_by, panel_organization_id gizlenir.
-- ÖNKOŞULLAR (Samet'in ekibi) - admin paneli staj başvurularını TARAYICIDAN okuyor:
--   app/[locale]/internship/page.tsx, internship/applications/page.tsx,
--   internship/applications/[id]/page.tsx (internship_applications, internship_votes,
--   internship_status_history) sunucu API'sine taşınmalı.
--   Site form okumaları gizli anahtar kullanıyor (lib/supabaseSiteApplications.ts), etkilenmez.
-- Not: Bu tablolarda e-posta bildirim adresi kolonu bulunmuyor (kontrol: 24.11.2026).
-- Not: package_settings herkese açık formda paket fiyatı göstermek için açık bırakıldı;
--   dahili ayar içeriyorsa kolon listesinden çıkarılmalı.
-- Önce: _policy_snapshot.sql (Forms'ta henüz alınmadı!)  |  Tekrar çalıştırılabilir
-- Geri alma: _rollback dosyası + snapshot CSV'si
begin;

-- Herkese tam yetki veren eski kurallar
drop policy if exists "Service role full access" on public.internship_applications;
drop policy if exists "Service role full access reviewers" on public.internship_reviewers;
drop policy if exists "Service role full access history" on public.internship_status_history;
drop policy if exists "Service role full access votes" on public.internship_votes;
drop policy if exists site_app_forms_write on public.myuni_site_application_forms;
drop policy if exists site_app_form_fields_write on public.myuni_site_application_form_fields;
drop policy if exists site_app_forms_select on public.myuni_site_application_forms;
drop policy if exists site_app_form_fields_select on public.myuni_site_application_form_fields;
drop policy if exists site_applications_select on public.myuni_site_applications;
drop policy if exists site_applications_update on public.myuni_site_applications;
drop policy if exists site_app_history_select on public.myuni_site_application_status_history;
-- Bağlı form kontrolü yapmayan alan kuralı (3 Kasım kuralı bu kontrolü yapıyor)
drop policy if exists "Anyone can read active form fields" on public.internship_form_fields;

-- RLS her tabloda açık olsun
alter table public.internship_applications enable row level security;
alter table public.internship_reviewers enable row level security;
alter table public.internship_status_history enable row level security;
alter table public.internship_votes enable row level security;
alter table public.myuni_site_applications enable row level security;
alter table public.myuni_site_application_status_history enable row level security;
alter table public.myuni_site_application_forms enable row level security;
alter table public.myuni_site_application_form_fields enable row level security;
alter table public.mentorships enable row level security;

-- TRUNCATE RLS'i atlar. Tarayıcı rollerinin bu yönetim/başvuru tablolarını
-- topluca silebilmesini grant seviyesinde de engelle.
revoke truncate on public.internship_applications from public, anon, authenticated;
revoke truncate on public.internship_reviewers from public, anon, authenticated;
revoke truncate on public.internship_status_history from public, anon, authenticated;
revoke truncate on public.internship_votes from public, anon, authenticated;
revoke truncate on public.myuni_site_applications from public, anon, authenticated;
revoke truncate on public.myuni_site_application_status_history from public, anon, authenticated;
revoke truncate on public.myuni_site_application_forms from public, anon, authenticated;
revoke truncate on public.myuni_site_application_form_fields from public, anon, authenticated;
revoke truncate on public.mentorships from public, anon, authenticated;

-- Yönetimsel alanları gizle
revoke select on public.myuni_site_application_forms from public, anon, authenticated;
grant select (
  id, slug_tr, slug_en, title_tr, title_en, subtitle_tr, subtitle_en,
  success_message_tr, success_message_en, is_active, show_on_website, allows_attachment,
  event_id, course_id, form_type, package_settings, created_at, updated_at
) on public.myuni_site_application_forms to anon, authenticated;

revoke select on public.mentorships from public, anon, authenticated;
grant select (
  id, slug, title, description, summary, mentor_name, mentor_title, mentor_bio,
  mentor_image_url, mentor_linkedin, mentorship_type, mode, location_name,
  application_deadline, start_date, end_date, max_mentees, current_mentees,
  is_application_open, thumbnail_url, banner_url, tags, order_index, is_active,
  is_featured, application_questions, created_at, updated_at
) on public.mentorships to anon, authenticated;

commit;
notify pgrst, 'reload schema';
