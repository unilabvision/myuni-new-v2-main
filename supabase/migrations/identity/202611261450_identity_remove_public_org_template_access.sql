-- VERİTABANI: Identity  |  ÖNKOŞULLU: KOD DEĞİŞMEDEN UYGULAMAYIN
-- Samet madde 3: tüm organizasyonları ve sertifika şablonlarını herkese açan erişim kaldırılsın;
--   bunlar sunucu API'leri üzerinden alınsın. Ek: panel yetkileri (user_module_access) de
--   herkese açık okunabiliyordu (kontrol: 25.11.2026), o da kapatılır.
-- Sonuç: bu üç tabloyu yalnızca gizli anahtarlı sunucu kodu okuyabilir.
--   Herkese açık gereken kurum bilgisi (ad, logo, kısaltma) sunucu API'sinden döndürülmeli.
-- ÖNKOŞULLAR (Samet'in ekibi) - admin paneli bu tabloları TARAYICIDAN okuyor:
--   organizations: app/[locale]/certificates (page, edit/[id], templates, templates/edit/[id],
--                  templates/create, settings)
--   certificate_templates: app/[locale]/lms/templates
--   user_module_access: app/[locale]/certificates/edit/[id], certificates/settings,
--                  lms-2, lms-2/templates, lms-2/templates/edit/[id], lms-2/settings
--   Site: lib/certificateService.ts:868/880 (certificate_templates) gizli anahtarla okumalı.
-- Not: depodaki dosya adı zaten "identity_public_catalog_policies" (yazım hatası yok).
-- Önce: _policy_snapshot.sql  |  Tekrar çalıştırılabilir  |  Geri alma: _rollback dosyası
begin;
drop policy if exists public_read_organizations on public.organizations;
drop policy if exists allow_read_organizations on public.organizations;
drop policy if exists compat_public_select on public.organizations;

drop policy if exists public_read_certificate_templates on public.certificate_templates;
drop policy if exists allow_read_certificate_templates on public.certificate_templates;
drop policy if exists compat_public_select on public.certificate_templates;

drop policy if exists allow_read_user_module_access on public.user_module_access;

alter table public.organizations enable row level security;
alter table public.certificate_templates enable row level security;
alter table public.user_module_access enable row level security;
commit;
