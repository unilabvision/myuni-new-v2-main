-- =========================================================
-- FAZ 2: discount_codes kilitleme
-- ÖNCE kodu deploy edin ve smoke test yapın, SONRA bunu çalıştırın.
-- RLS açık kalır; anon/authenticated policy kalkar → dışarıdan erişim yok.
-- service_role (API / supabaseAdmin) etkilenmez.
-- =========================================================

BEGIN;

DROP POLICY IF EXISTS "compat_temp_all" ON public.discount_codes;
DROP POLICY IF EXISTS "compat_public_select" ON public.discount_codes;

COMMIT;

-- Doğrulama (0 satır beklenir):
-- SELECT policyname FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'discount_codes';

-- Acil rollback:
-- CREATE POLICY "compat_temp_all" ON public.discount_codes
--   FOR ALL TO anon, authenticated
--   USING (true) WITH CHECK (true);
