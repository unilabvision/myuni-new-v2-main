# Shopier Link Entegrasyonu

Eğitimler Shopier panelde ürün olarak tanımlanıp **link ile** satılıyor; ödeme sitede değil Shopier’da alınıyor. Kullanıcı ödemeyi Shopier’da yaptıktan sonra sitede ilgili kursa otomatik kaydedilir ve izlemeye devam eder.

## Verdiğiniz 6 eğitim – Supabase eşleme tablosu

`myuni_courses` tablosunda ilgili kurs satırında **shopier_product_id** ve **shopier_product_url** sütunlarını aşağıdaki gibi doldurun (kurs adı sitedeki kayıtla birebir aynı olmak zorunda değil; doğru kurs satırını kendiniz seçin):

| Eğitim adı (sitede) | shopier_product_id | shopier_product_url |
|---------------------|--------------------|----------------------|
| CRISPR-Cas9 Teknolojisi ve Genomik Düzenleme Eğitimi | 43968703 | https://www.shopier.com/MyUNI/43968703 |
| Python ile Biyoinformatikte DNA Dizi Analizi | 43993244 | https://www.shopier.com/MyUNI/43993244 |
| Farmasötik Nanoteknoloji Eğitimi | 43968441 | https://www.shopier.com/MyUNI/43968441 |
| İlaç Geliştirmeye Giriş Eğitimi | 43992565 | https://www.shopier.com/MyUNI/43992565 |
| Farmasötik Kimyaya Giriş Eğitimi | 43993081 | https://www.shopier.com/MyUNI/43993081 |
| R Programlamaya Giriş Eğitimi | 43992627 | https://www.shopier.com/MyUNI/43992627 |

**Önemli:** `shopier_product_id` olarak linkin sonundaki **sayıyı** (örn. 43968703) kullanın. Shopier webhook’ta bu değer `product_id`, `product_sku`, `sku` veya URL içinden otomatik çıkarılabiliyor.

## Akış

1. **Kurs sayfası** – Kursta `shopier_product_url` varsa buton metni **"Shopier'da Satın Al"** olur; tıklanınca Shopier satın alma sayfası yeni sekmede açılır.
2. **Ödeme** – Kullanıcı Shopier’da ödemeyi tamamlar.
3. **Webhook (OSB)** – Shopier, ödeme tamamlanınca `POST /api/shopier-webhook` adresine istek atar. Bu istekte ürün bilgisi ve alıcı e‑postası vardır; sipariş kaydedilir, e‑posta ile eşleşen site kullanıcısı varsa kursa yazılır.
4. **Dönüş URL’si** – Shopier, kullanıcıyı başarı sayfasına yönlendirebilir. URL’de `order_id` varsa sayfa `/api/order-by-id?order_id=...` ile siparişi alıp `courseId` ile ödeme başarı sayfasını gösterir.

## Veritabanı

- **Migration:** `supabase/migrations/20250207000000_add_shopier_course_fields.sql`  
  - `myuni_courses` tablosuna `shopier_product_id` ve `shopier_product_url` eklenir.
- Her Shopier ürünü için:
  - **shopier_product_id:** Shopier’daki ürün ID’si (veya SKU); webhook’ta hangi kursa yazılacağını eşleştirmek için kullanılır.
  - **shopier_product_url:** Satın alma linki; "Shopier'da Satın Al" butonu bu linki açar.

Migration’ı Supabase’de çalıştırın veya SQL ile alanları manuel ekleyin.

## Shopier Panel Ayarları

1. **Ürün / link** – Her eğitim için bir ürün veya ödeme linki oluşturun.
2. **Ürün ID / SKU** – Bu değeri ilgili kursun `shopier_product_id` alanına yazın (Supabase’de `myuni_courses` güncellemesi veya admin panel).
3. **Satın alma linki** – Ürünün/ödeme sayfasının URL’sini ilgili kursun `shopier_product_url` alanına yazın.
4. **Otomatik Sipariş Bildirimi (OSB)** – Webhook URL’si:  
   `https://SITE_DOMAIN/api/shopier-webhook`  
   Ödeme tamamlandığında Shopier’ın gönderdiği alan adları (ör. `order_id`, `product_id`/`product_sku`/`sku`, `buyer_email`, `status`) dokümantasyonla uyumlu olmalı; webhook bu alanları okuyor.
5. **Başarılı ödeme sonrası yönlendirme** – Müşteriyi şu formatta yönlendirin:  
   `https://SITE_DOMAIN/tr/payment-success?order_id=SHOPIER_SIPARIS_ID`  
   (Shopier’da `order_id` değişkeni varsa kullanın.)

## API Özeti

| Endpoint | Açıklama |
|----------|----------|
| `POST /api/shopier-webhook` | Shopier OSB isteği. Sipariş kaydı + e‑posta ile kullanıcı bulunup kursa yazılır. |
| `GET /api/order-by-id?order_id=...` | Siparişe göre `courseId` ve `courseName` döner; başarı sayfası yönlendirmesi için. |

## Kullanıcı Eşleşmesi

- Webhook’ta gelen **alıcı e‑postası** ile Clerk’ta kullanıcı aranır.
- Bulunursa bu kullanıcı ilgili kursa yazılır ve (varsa) satın alma onay e‑postası gönderilir.
- E‑posta sitede kayıtlı değilse sipariş yine kaydedilir; kullanıcı siteye üye olup giriş yaptığında ileride "e‑postaya göre bekleyen siparişleri kaydet" gibi bir akış eklenebilir.

## Sitede üye olmadan satın alan kullanıcı

Ödemeyi Shopier’da yapan e-posta sitede henüz kayıtlı değilse sipariş yine kaydedilir. Kullanıcı **aynı e-posta ile** sitede üye olup giriş yaptığında, **Dashboard** açıldığında otomatik olarak bekleyen Shopier siparişleri kursa yazılır; ek işlem gerekmez.

## Özet Checklist

- [ ] Migration çalıştırıldı (`shopier_product_id`, `shopier_product_url`).
- [ ] Her Shopier ürünü için kurs kaydında `shopier_product_id` (linkteki sayı) ve `shopier_product_url` (tam link) dolduruldu.
- [ ] Shopier’da OSB webhook URL’si ayarlandı: `https://SITE_DOMAIN/api/shopier-webhook`.
- [ ] Başarı URL’si ayarlandı: `https://SITE_DOMAIN/tr/payment-success?order_id=...` (Shopier’da sipariş no değişkeni varsa kullanın).
