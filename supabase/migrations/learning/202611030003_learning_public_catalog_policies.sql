begin;

drop policy if exists public_read_active_courses on public.myuni_courses;
create policy public_read_active_courses
on public.myuni_courses for select to anon, authenticated
using (is_active = true);

drop policy if exists public_read_active_course_sections on public.myuni_course_sections;
create policy public_read_active_course_sections
on public.myuni_course_sections for select to anon, authenticated
using (
  is_active = true and exists (
    select 1 from public.myuni_courses c
    where c.id = myuni_course_sections.course_id and c.is_active = true
  )
);

drop policy if exists public_read_active_course_lessons on public.myuni_course_lessons;
create policy public_read_active_course_lessons
on public.myuni_course_lessons for select to anon, authenticated
using (
  is_active = true and exists (
    select 1
    from public.myuni_course_sections s
    join public.myuni_courses c on c.id = s.course_id
    where s.id = myuni_course_lessons.section_id
      and s.is_active = true and c.is_active = true
  )
);

drop policy if exists public_read_course_objectives on public.myuni_course_objectives;
create policy public_read_course_objectives
on public.myuni_course_objectives for select to anon, authenticated
using (exists (
  select 1 from public.myuni_courses c
  where c.id = myuni_course_objectives.course_id and c.is_active = true
));

drop policy if exists public_read_course_requirements on public.myuni_course_requirements;
create policy public_read_course_requirements
on public.myuni_course_requirements for select to anon, authenticated
using (exists (
  select 1 from public.myuni_courses c
  where c.id = myuni_course_requirements.course_id and c.is_active = true
));

drop policy if exists public_read_active_course_tiers on public.myuni_course_tiers;
create policy public_read_active_course_tiers
on public.myuni_course_tiers for select to anon, authenticated
using (is_active = true and exists (
  select 1 from public.myuni_courses c
  where c.id = myuni_course_tiers.course_id and c.is_active = true
));

drop policy if exists public_read_active_packages on public.myuni_packages;
create policy public_read_active_packages
on public.myuni_packages for select to anon, authenticated
using (is_active = true);

drop policy if exists public_read_active_package_courses on public.myuni_package_courses;
create policy public_read_active_package_courses
on public.myuni_package_courses for select to anon, authenticated
using (
  exists (select 1 from public.myuni_packages p where p.id = package_id and p.is_active = true)
  and exists (select 1 from public.myuni_courses c where c.id = course_id and c.is_active = true)
);

drop policy if exists public_read_career_tags on public.myuni_career_tags;
create policy public_read_career_tags
on public.myuni_career_tags for select to anon, authenticated using (true);

drop policy if exists public_read_active_course_career_tags on public.myuni_course_career_tags;
create policy public_read_active_course_career_tags
on public.myuni_course_career_tags for select to anon, authenticated
using (exists (
  select 1 from public.myuni_courses c
  where c.id = myuni_course_career_tags.course_id and c.is_active = true
));

drop policy if exists public_read_active_opportunities on public.myuni_opportunities;
create policy public_read_active_opportunities
on public.myuni_opportunities for select to anon, authenticated
using (is_active = true);

drop policy if exists public_read_active_opportunity_tags on public.myuni_opportunity_career_tags;
create policy public_read_active_opportunity_tags
on public.myuni_opportunity_career_tags for select to anon, authenticated
using (exists (
  select 1 from public.myuni_opportunities o
  where o.id = myuni_opportunity_career_tags.opportunity_id and o.is_active = true
));

drop policy if exists public_read_active_opportunity_courses on public.myuni_opportunity_courses;
create policy public_read_active_opportunity_courses
on public.myuni_opportunity_courses for select to anon, authenticated
using (exists (
  select 1 from public.myuni_opportunities o
  where o.id = myuni_opportunity_courses.opportunity_id and o.is_active = true
));

drop policy if exists public_read_approved_course_comments on public.myuni_comments;
create policy public_read_approved_course_comments
on public.myuni_comments for select to anon, authenticated
using (status = 'approved');

commit;
