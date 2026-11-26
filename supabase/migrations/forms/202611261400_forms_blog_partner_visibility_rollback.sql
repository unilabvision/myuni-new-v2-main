-- VERİTABANI: Forms  |  202611261400_forms_blog_partner_visibility.sql dosyasını GERİ ALIR
-- Politikaları 3 Kasım haline döndürür. Eklenen kolonlar veri kaybı olmasın diye bırakılır
-- (tamamen kaldırmak için en alttaki iki satırın yorumunu açın).
begin;
drop policy if exists public_read_blog_posts on public.unilab_vision_blog_posts;
create policy public_read_blog_posts on public.unilab_vision_blog_posts
  for select to anon, authenticated using (true);
drop policy if exists public_read_blog_tags on public.unilab_vision_blog_post_tags;
create policy public_read_blog_tags on public.unilab_vision_blog_post_tags
  for select to anon, authenticated using (true);
drop policy if exists public_read_partners on public.partners;
create policy public_read_partners on public.partners
  for select to anon, authenticated using (true);
-- alter table public.unilab_vision_blog_posts drop column if exists is_published;
-- alter table public.partners drop column if exists is_active;
commit;
