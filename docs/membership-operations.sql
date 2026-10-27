-- MyUNI membership operational queries
-- Run only after docs/membership-migration.sql.

-- 0) Security and installation check. Every row should have the values shown
-- by the column names: direct client access false, service role CRUD true.
with target_tables(table_name) as (
  values
    ('myuni_membership_plans'),
    ('myuni_membership_plan_benefits'),
    ('myuni_membership_passes'),
    ('myuni_membership_entitlements'),
    ('myuni_membership_audit_log')
)
select
  target_tables.table_name,
  to_regclass(format('public.%I', target_tables.table_name)) is not null as table_exists,
  has_table_privilege('anon', format('public.%I', target_tables.table_name), 'SELECT') as anon_select,
  has_table_privilege('anon', format('public.%I', target_tables.table_name), 'INSERT') as anon_insert,
  has_table_privilege('anon', format('public.%I', target_tables.table_name), 'UPDATE') as anon_update,
  has_table_privilege('anon', format('public.%I', target_tables.table_name), 'DELETE') as anon_delete,
  has_table_privilege('authenticated', format('public.%I', target_tables.table_name), 'SELECT') as authenticated_select,
  has_table_privilege('authenticated', format('public.%I', target_tables.table_name), 'INSERT') as authenticated_insert,
  has_table_privilege('authenticated', format('public.%I', target_tables.table_name), 'UPDATE') as authenticated_update,
  has_table_privilege('authenticated', format('public.%I', target_tables.table_name), 'DELETE') as authenticated_delete,
  has_table_privilege('service_role', format('public.%I', target_tables.table_name), 'SELECT') as service_role_select,
  has_table_privilege('service_role', format('public.%I', target_tables.table_name), 'INSERT') as service_role_insert,
  has_table_privilege('service_role', format('public.%I', target_tables.table_name), 'UPDATE') as service_role_update,
  has_table_privilege('service_role', format('public.%I', target_tables.table_name), 'DELETE') as service_role_delete
from target_tables
order by target_tables.table_name;

select
  has_function_privilege('anon', 'public.myuni_membership_deliver_pass(text)', 'EXECUTE') as anon_execute,
  has_function_privilege('authenticated', 'public.myuni_membership_deliver_pass(text)', 'EXECUTE') as authenticated_execute,
  has_function_privilege('service_role', 'public.myuni_membership_deliver_pass(text)', 'EXECUTE') as service_role_execute;

-- 1) Published packages exactly as MyUNI's public API sees them.
select
  p.id,
  p.code,
  p.version,
  p.duration_months,
  p.name_tr,
  p.price,
  p.currency,
  p.published_at,
  count(b.id) as benefit_count
from public.myuni_membership_plans p
left join public.myuni_membership_plan_benefits b on b.plan_id = p.id
where p.status = 'published' and p.is_visible = true
group by p.id
order by p.duration_months;

-- 2) Detect invalid publication state. Expected result: zero rows.
select code, count(*) as published_versions
from public.myuni_membership_plans
where status = 'published'
group by code
having count(*) > 1;

-- 3) Drafts waiting for publication.
select id, code, version, duration_months, price, currency, updated_at, updated_by
from public.myuni_membership_plans
where status = 'draft'
order by updated_at desc;

-- 4) Package benefit detail with catalog labels.
select
  p.code,
  p.version,
  b.resource_type,
  b.access_scope,
  b.capability,
  coalesce(c.title, pr.title, e.title, b.label_tr) as resource_title,
  b.resource_id
from public.myuni_membership_plan_benefits b
join public.myuni_membership_plans p on p.id = b.plan_id
left join public.myuni_courses c
  on b.resource_type = 'course' and c.id = b.resource_id
left join public.myuni_products pr
  on b.resource_type = 'product' and pr.id = b.resource_id
left join public.myuni_events e
  on b.resource_type = 'event' and e.id = b.resource_id
order by p.duration_months, b.sort_order, resource_title;

-- 5) Active access for one Clerk user. Replace the value before running.
select p.id, p.user_id, p.starts_at, p.ends_at, p.status, p.plan_snapshot
from public.myuni_membership_passes p
where p.user_id = 'user_REPLACE_ME'
  and p.status = 'active'
  and p.starts_at <= now()
  and p.ends_at > now()
order by p.ends_at desc;

-- 6) Expired rows that can be marked by a scheduled maintenance job.
update public.myuni_membership_passes
set status = 'expired'
where status = 'active' and ends_at <= now()
returning id, user_id, ends_at;

-- 7) Passes expiring in the next seven days.
select user_id, user_email, ends_at, plan_snapshot ->> 'name_tr' as plan_name
from public.myuni_membership_passes
where status = 'active'
  and ends_at > now()
  and ends_at <= now() + interval '7 days'
order by ends_at;

-- 8) Recent admin changes.
select actor_user_id, action, entity_type, entity_id, created_at, metadata
from public.myuni_membership_audit_log
order by created_at desc
limit 100;

-- 9) Optional initial drafts. Run once only if the plans table is empty.
-- Do not run when plans and prices will be managed by Uniboard.
insert into public.myuni_membership_plans
  (family_code, code, version, duration_months, name_tr, name_en, price, currency)
select * from (values
  ('MYUNI_ACCESS', 'MYUNI_1_MONTH', 1, 1, '1 Aylık MyUNI', '1 Month MyUNI', 0::numeric, 'TRY'),
  ('MYUNI_ACCESS', 'MYUNI_3_MONTHS', 1, 3, '3 Aylık MyUNI', '3 Months MyUNI', 0::numeric, 'TRY'),
  ('MYUNI_ACCESS', 'MYUNI_6_MONTHS', 1, 6, '6 Aylık MyUNI', '6 Months MyUNI', 0::numeric, 'TRY')
) as seed(family_code, code, version, duration_months, name_tr, name_en, price, currency)
where not exists (select 1 from public.myuni_membership_plans);
