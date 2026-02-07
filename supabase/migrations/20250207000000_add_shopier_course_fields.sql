-- Shopier link entegrasyonu: Eğitimler Shopier'da tanımlı, satın alma linki ile eşleşecek.
-- Bu alanlar myuni_courses tablosuna eklenir.

ALTER TABLE myuni_courses
ADD COLUMN IF NOT EXISTS shopier_product_id text,
ADD COLUMN IF NOT EXISTS shopier_product_url text;

COMMENT ON COLUMN myuni_courses.shopier_product_id IS 'Shopier paneldeki ürün ID - webhook eşleşmesi için';
COMMENT ON COLUMN myuni_courses.shopier_product_url IS 'Shopier satın alma sayfası linki - "Shopier''da satın al" butonu için';
