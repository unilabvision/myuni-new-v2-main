-- Supabase SQL Editor'da bu sorguyu çalıştırın:
-- =====================================================
-- KULLANICI: eylulalakus52@gmail.com
-- USER ID: user_3HpGOS4TknlF7lmAOI1HgpaXCG3
-- =====================================================

-- 1. Önce order'ların custom_data'sını kontrol et
SELECT 
  orderid,
  status,
  coursename,
  amount,
  custom_data->'cartItems' as cart_items,
  custom_data->'userId' as user_id,
  created_at
FROM orders
WHERE orderid IN (
  'MYU-IYZ-1787220839917-5317',
  'MYU-IYZ-1786557665796-8182'
)
ORDER BY created_at DESC;

-- 2. Eğer Iyzico'da ödeme başarılı görünüyorsa, bu sorguyu çalıştır:
-- (ÖNCELİKLE YUKARIDAK SORGUYLA CART ITEMS'I KONTROL ET!)

-- NOT: Aşağıdaki sorguyu çalıştırmadan ÖNCE:
-- 1. Yukarıdaki SELECT'ten dönen cart_items'ı not alın
-- 2. Her item için course_id'yi alın
-- 3. Hangi kursa enrollment oluşturacağınızı belirleyin

-- 3. Order'ı completed olarak işaretle:
UPDATE orders
SET 
  status = 'completed',
  updated_at = NOW()
WHERE orderid = 'MYU-IYZ-1787220839917-5317'; -- En yeni sipariş

-- 4. Sepetteki kurs için enrollment oluştur:
-- (course_id'yi yukarıdaki SELECT'ten alın ve buraya yazın)
INSERT INTO myuni_enrollments (
  user_id,
  course_id,
  enrolled_at,
  progress_percentage,
  is_active
) VALUES (
  'user_3HpGOS4TknlF7lmAOI1HgpaXCG3',
  'BURAYA_COURSE_ID_YAZIN',  -- cart_items'dan aldığınız course_id
  NOW(),
  0,
  true
)
ON CONFLICT (user_id, course_id) 
DO UPDATE SET 
  is_active = true,
  enrolled_at = NOW();

-- 5. Enrollment ID'yi order'a ekle:
UPDATE orders
SET 
  enrolled = true,
  enrollmentid = (
    SELECT id 
    FROM myuni_enrollments 
    WHERE user_id = 'user_3HpGOS4TknlF7lmAOI1HgpaXCG3'
    AND course_id = 'BURAYA_COURSE_ID_YAZIN'
    LIMIT 1
  )
WHERE orderid = 'MYU-IYZ-1787220839917-5317';

-- =====================================================
-- ESKİ SİPARİŞ İÇİN DE AYNISINI TEKRARLA (isteğe bağlı):
-- orderid = 'MYU-IYZ-1786557665796-8182'
-- =====================================================
