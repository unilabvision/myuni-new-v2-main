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
5. Önce yerel/staging ortamında çalıştırılır; production öncesinde tablo, kolon, RLS ve yetkiler kontrol edilir.
6. Canlıda uygulanan her migration, plan dokümanındaki "Değişiklik kaydı" tablosuna yazılır.

Not: Supabase CLI alt klasörleri otomatik okumaz. Bu dosyalar SQL Editor'den,
ilgili veritabanında, elle ve sırayla çalıştırılır.

## Geçmiş
`202611030001`–`202611030004` dosyaları 3 Kasım 2026'da canlıya uygulanmıştır ve
geçmiş kaydı olarak ilgili klasöre taşınmıştır (içerikleri değiştirilmedi).
`identity/202611030002_identity_public_catalog_policies.sql` içindeki organizasyon ve
sertifika şablonu politikaları, admin paneli bu tabloları sunucu API'sine taşıdıktan
sonra ayrı bir migration ile kaldırılacaktır.
