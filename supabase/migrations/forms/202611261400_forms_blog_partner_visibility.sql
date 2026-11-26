-- VERİTABANI: Forms  |  HEMEN UYGULANABİLİR (kod değişikliği gerekmez)
-- Samet madde 2: yalnızca yayınlanmış blog yazıları ve aktif partnerler herkese açık olsun.
--   * unilab_vision_blog_posts.is_published ve partners.is_active eklenir.
--     Mevcut tüm kayıtlar varsayılan olarak TRUE olur: sitede hiçbir şey kaybolmaz.
--   * Etiketler yalnızca yayınlanmış yazılar için görünür.
--   * Platform (site) filtresi sorguda/API'de uygulanır; RLS çağıranın hangi siteden geldiğini bilemez.
-- Kod etkisi: site blog sorguları açık kolon listesi kullanıyor; satır filtresi kodu bozmaz.
--   Panelde yazıyı/partneri gizlemek için bu alanları açıp kapatan bir düğme ayrıca eklenmeli.
-- Önce: _policy_snapshot.sql  |  Tekrar çalıştırılabilir  |  Geri alma: _rollback dosyası
begin;

alter table public.unilab_vision_blog_posts
  add column if not exists is_published boolean not null default true;
alter table public.partners
  add column if not exists is_active boolean not null default true;

drop policy if exists public_read_blog_posts on public.unilab_vision_blog_posts;
create policy public_read_blog_posts
  on public.unilab_vision_blog_posts for select to anon, authenticated
  using (is_published = true);

drop policy if exists public_read_blog_tags on public.unilab_vision_blog_post_tags;
create policy public_read_blog_tags
  on public.unilab_vision_blog_post_tags for select to anon, authenticated
  using (exists (
    select 1 from public.unilab_vision_blog_posts p
    where p.post_id = unilab_vision_blog_post_tags.post_id
      and p.site = unilab_vision_blog_post_tags.site
      and p.is_published = true
  ));

drop policy if exists "Partners are viewable by everyone" on public.partners;
drop policy if exists public_read_partners on public.partners;
create policy public_read_partners
  on public.partners for select to anon, authenticated
  using (is_active = true);

commit;
