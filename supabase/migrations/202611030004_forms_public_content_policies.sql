begin;

drop policy if exists public_read_blog_posts on public.unilab_vision_blog_posts;
create policy public_read_blog_posts
on public.unilab_vision_blog_posts for select to anon, authenticated using (true);

drop policy if exists public_read_blog_categories on public.unilab_vision_blog_categories;
create policy public_read_blog_categories
on public.unilab_vision_blog_categories for select to anon, authenticated using (true);

drop policy if exists public_read_blog_tags on public.unilab_vision_blog_post_tags;
create policy public_read_blog_tags
on public.unilab_vision_blog_post_tags for select to anon, authenticated using (true);

drop policy if exists public_read_partners on public.partners;
create policy public_read_partners
on public.partners for select to anon, authenticated using (true);

drop policy if exists public_read_active_mentorships on public.mentorships;
create policy public_read_active_mentorships
on public.mentorships for select to anon, authenticated using (is_active = true);

drop policy if exists public_read_site_forms on public.myuni_site_application_forms;
create policy public_read_site_forms
on public.myuni_site_application_forms for select to anon, authenticated
using (is_active = true and show_on_website = true);

drop policy if exists public_read_site_form_fields on public.myuni_site_application_form_fields;
create policy public_read_site_form_fields
on public.myuni_site_application_form_fields for select to anon, authenticated
using (exists (
  select 1 from public.myuni_site_application_forms f
  where f.id = myuni_site_application_form_fields.form_id
    and f.is_active = true and f.show_on_website = true
));

drop policy if exists public_read_internship_form_configs on public.internship_form_configs;
create policy public_read_internship_form_configs
on public.internship_form_configs for select to anon, authenticated
using (is_active = true);

drop policy if exists public_read_internship_form_fields on public.internship_form_fields;
create policy public_read_internship_form_fields
on public.internship_form_fields for select to anon, authenticated
using (is_active = true and exists (
  select 1 from public.internship_form_configs f
  where f.id = internship_form_fields.form_config_id and f.is_active = true
));

drop policy if exists public_read_unilab_form_configs on public.unilab_vision_form_configs;
create policy public_read_unilab_form_configs
on public.unilab_vision_form_configs for select to anon, authenticated
using (is_active = true);

drop policy if exists public_read_unilab_form_fields on public.unilab_vision_form_fields;
create policy public_read_unilab_form_fields
on public.unilab_vision_form_fields for select to anon, authenticated
using (is_active = true and exists (
  select 1 from public.unilab_vision_form_configs f
  where f.id = unilab_vision_form_fields.form_config_id and f.is_active = true
));

commit;
