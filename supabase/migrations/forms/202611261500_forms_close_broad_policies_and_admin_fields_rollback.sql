-- VERİTABANI: Forms  |  Kolon kısıtlarını kaldırır.
-- Silinen eski kurallar Forms'ta birebir bilinmediği için, geri yüklemek için
-- uygulamadan önce alınan _policy_snapshot.sql CSV'sindeki ilgili satırları çalıştırın.
begin;
grant truncate on public.internship_applications to anon, authenticated;
grant truncate on public.internship_reviewers to anon, authenticated;
grant truncate on public.internship_status_history to anon, authenticated;
grant truncate on public.internship_votes to anon, authenticated;
grant truncate on public.myuni_site_applications to anon, authenticated;
grant truncate on public.myuni_site_application_status_history to anon, authenticated;
grant truncate on public.myuni_site_application_forms to anon, authenticated;
grant truncate on public.myuni_site_application_form_fields to anon, authenticated;
grant truncate on public.mentorships to anon, authenticated;
grant select on public.myuni_site_application_forms to anon, authenticated;
grant select on public.mentorships to anon, authenticated;
commit;
notify pgrst, 'reload schema';
