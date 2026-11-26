-- VERİTABANI: Forms  |  Kolon kısıtlarını kaldırır.
-- Silinen eski kurallar Forms'ta birebir bilinmediği için, geri yüklemek için
-- uygulamadan önce alınan _policy_snapshot.sql CSV'sindeki ilgili satırları çalıştırın.
begin;
grant select on public.myuni_site_application_forms to anon, authenticated;
grant select on public.mentorships to anon, authenticated;
commit;
notify pgrst, 'reload schema';
