-- VERİTABANI: Learning  |  ÖNKOŞULLU: KOD DEĞİŞMEDEN UYGULAMAYIN
-- Samet madde 4: public katalog yalnızca tanıtım alanlarını göstersin; paket ve fırsatların
--   dahili alanları anonim kullanıcılara açılmasın.
-- Yöntem: herkese açık anahtar (anon, authenticated) için tablo okuma izni kaldırılır,
--   yalnızca güvenli kolonlara okuma izni verilir. Gizlenenler:
--   myuni_courses:       instructor_email, shopier_product_id, shopier_product_url
--   myuni_course_tiers:  shopier_product_id, shopier_product_url
--   myuni_packages:      instructor_email, shopier_product_id, shopier_product_url
--   myuni_opportunities: created_by, panel_organization_id
-- DİKKAT: Bu tablolardan herkese açık anahtarla select('*') ya da gizlenen bir kolonu seçen
--   her sorgu "permission denied" hatası verir. Gizli anahtar (sunucu API) etkilenmez.
-- ÖNKOŞULLAR (Samet'in ekibi):
--   Site: lib/courseService.ts (PUBLIC_COURSE_COLUMNS, COURSE_DETAIL_COLUMNS, PACKAGE_DETAIL_COLUMNS,
--         COURSE_TIER_COLUMNS listelerinden instructor_email ve shopier_* çıkarılmalı),
--         app/[locale]/checkout, app/[locale]/payment-success, app/[locale]/page.tsx,
--         app/components/EnrollmentButton.tsx, app/api/search, app/api/public/courses.
--   Panel: myuni_courses'u tarayıcıdan okuyan sayfalar (lms-2, lms/courses, lms/progress,
--         watch, analytics) sunucu API'sine taşınmalı.
-- Önce: _policy_snapshot.sql  |  Tekrar çalıştırılabilir  |  Geri alma: _rollback dosyası
begin;

revoke select on public.myuni_courses from public, anon, authenticated;
revoke insert, update, delete, truncate on public.myuni_courses
  from public, anon, authenticated;
grant select (
  id, slug, title, description, instructor_name, duration, level, price, original_price,
  thumbnail_url, banner_url, is_active, created_at, updated_at, instructor_description,
  instructor_linkedin, instructor_image_url, course_type, live_start_date, live_end_date,
  live_timezone, max_participants, current_participants, session_count,
  session_duration_minutes, registration_deadline, is_registration_open,
  early_bird_price, early_bird_deadline, program_type, is_featured
) on public.myuni_courses to anon, authenticated;

revoke select on public.myuni_course_tiers from public, anon, authenticated;
revoke insert, update, delete, truncate on public.myuni_course_tiers
  from public, anon, authenticated;
grant select (
  id, course_id, title, slug, description, price, original_price, early_bird_price,
  early_bird_deadline, is_registration_open, is_active, order_index, includes_qa,
  session_labels, created_at, updated_at, is_full_course
) on public.myuni_course_tiers to anon, authenticated;

revoke select on public.myuni_packages from public, anon, authenticated;
revoke insert, update, delete, truncate on public.myuni_packages
  from public, anon, authenticated;
grant select (
  id, slug, title, description, instructor_name, instructor_description,
  instructor_linkedin, instructor_image_url, duration, level, price, original_price,
  thumbnail_url, banner_url, is_active, created_at, updated_at, objectives, requirements
) on public.myuni_packages to anon, authenticated;

revoke select on public.myuni_opportunities from public, anon, authenticated;
revoke insert, update, delete, truncate on public.myuni_opportunities
  from public, anon, authenticated;
grant select (
  id, slug, title, description, company_name, location, work_mode, application_deadline,
  form_config_id, site_form_id, is_active, is_featured, order_index, opportunity_type,
  banner_url, thumbnail_url, created_at, updated_at
) on public.myuni_opportunities to anon, authenticated;

commit;
notify pgrst, 'reload schema';
