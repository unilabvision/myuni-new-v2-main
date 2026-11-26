# Supabase migration'ları

MyUNI üç ayrı Supabase veritabanı kullanır. Her klasör yalnızca kendi veritabanını hedefler:

| Klasör | Veritabanı | İçerik |
| --- | --- | --- |
| `identity/` | Identity | kullanıcılar, siparişler, sertifikalar, organizasyonlar |
| `learning/` | Learning | kurslar, dersler, etkinlikler, ilerleme, Unicom |
| `forms/` | Forms | formlar, başvurular, blog, partnerler |

## Kurallar
1. Dosya adı: `YYYYMMDDHHMM_aciklama.sql` (tarih + saat, sıralı).
2. Her dosya tek bir veritabanını hedefler; ilk satırda hangisi olduğu yazar.
3. Her migration tekrar çalıştırılabilir olmalıdır (`if exists` / `if not exists`).
4. Her migration'ın yanında `_rollback.sql` ile biten bir geri alma dosyası bulunur.
5. Politika değiştiren her migration'dan önce o veritabanında `_policy_snapshot.sql`
   çalıştırılır ve sonucu saklanır (politikaların birebir eski hali).
6. Önce yerel/staging ortamında çalıştırılır; production öncesinde tablo, kolon, RLS ve yetkiler kontrol edilir.
7. Canlıda uygulanan her migration, plan dokümanındaki "Değişiklik kaydı" tablosuna yazılır.

Not: Supabase CLI alt klasörleri otomatik okumaz. Bu dosyalar SQL Editor'den,
ilgili veritabanında, elle ve sırayla çalıştırılır.

## Dosyalar ve durumları

**HEMEN** = kod değişikliği gerekmez. **ÖNKOŞULLU** = dosyanın başında yazan kod değişiklikleri
yayına alınmadan uygulanmaz (aksi halde site veya admin paneli bozulur).

| Veritabanı | Dosya | Durum | Samet maddesi |
| --- | --- | --- | --- |
| Identity | `202611030001_create_user_profiles` | Canlıda (3 Kasım) | 1 |
| Identity | `202611030002_identity_public_catalog_policies` | Canlıda (3 Kasım), 202611261450 ile daraltılacak | 3 |
| Identity | `202611251000_user_profiles_hardening` | HEMEN (önce e-posta tekrar kontrolü) | 1 |
| Identity | `202611261450_identity_remove_public_org_template_access` | ÖNKOŞULLU (admin paneli) | 3 |
| Learning | `202611030003_learning_public_catalog_policies` | Canlıda (3 Kasım) | 4 |
| Learning | `202611240001_myuni_events_duration_temporary` | Canlıda (24 Kasım), geçici | 5 |
| Learning | `202611250900_close_compat_temp_all` | HEMEN | güvenlik |
| Learning | `202611250910_unicom_close_public_write_and_pii` | HEMEN (Samet kararı) | güvenlik |
| Learning | `202611261410_learning_comments_require_active_course` | HEMEN | 4 |
| Learning | `202611261420_learning_lessons_add_is_preview` | HEMEN | 4 |
| Learning | `202611261430_learning_lessons_preview_only_public` | ÖNKOŞULLU (site + panel) | 4 |
| Learning | `202611261440_learning_public_catalog_columns` | ÖNKOŞULLU (site + panel) | 4 |
| Forms | `202611030004_forms_public_content_policies` | Canlıda (3 Kasım) | 2 |
| Forms | `202611261400_forms_blog_partner_visibility` | HEMEN | 2 |
| Forms | `202611261500_forms_close_broad_policies_and_admin_fields` | ÖNKOŞULLU (admin paneli) | 2 |

## Önerilen uygulama sırası
1. Her veritabanında `_policy_snapshot.sql` → sonucu sakla.
2. HEMEN dosyaları, tablo sırasıyla.
3. Kod değişiklikleri yayına alındıkça ÖNKOŞULLU dosyalar.
4. Etkinlik sertifikası kodu `duration_minutes`'a geçince `202611240001_..._rollback.sql`.
