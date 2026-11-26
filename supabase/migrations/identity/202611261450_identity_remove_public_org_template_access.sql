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

-- Yanlışlıkla eski/ayrı Certificate projesinde çalıştırılmasın. Uygulamanın
-- Identity projesinde bu dört tablo birlikte bulunur.
do $$
begin
  if to_regclass('public.user_profiles') is null
     or to_regclass('public.organizations') is null
     or to_regclass('public.certificate_templates') is null
     or to_regclass('public.user_module_access') is null then
    raise exception
      'Yanlis Identity hedefi: user_profiles, organizations, certificate_templates ve user_module_access ayni projede olmali';
  end if;
end $$;

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

-- Policy adı ortamlar arasında farklı olsa bile tarayıcı anahtarlarını kesin kapat.
-- TRUNCATE RLS tarafından engellenmediği için yalnızca SELECT değil tüm doğrudan
-- tablo yetkileri kaldırılır. service_role yetkileri etkilenmez.
revoke all privileges on public.organizations from public, anon, authenticated;
revoke all privileges on public.certificate_templates from public, anon, authenticated;
revoke all privileges on public.user_module_access from public, anon, authenticated;
commit;
