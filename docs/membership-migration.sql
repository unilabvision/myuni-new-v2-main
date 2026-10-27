-- MyUNI fixed-term membership foundation
-- Target: MyUNI primary Supabase project (emfvwpztyuykqtepnsfp)
-- Safe rollout: additive schema; it does not alter existing orders, enrollments or purchases.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';

do $$
declare
  required_relation text;
begin
  foreach required_relation in array array[
    'public.orders',
    'public.modules',
    'public.myuni_courses',
    'public.myuni_products',
    'public.myuni_events'
  ]
  loop
    if to_regclass(required_relation) is null then
      raise exception 'Required relation is missing: %', required_relation;
    end if;
  end loop;
end;
$$;

create extension if not exists pgcrypto;

alter table if exists public.myuni_membership_plans
  drop constraint if exists myuni_membership_plans_duration_months_check;

alter table if exists public.myuni_membership_plans
  drop constraint if exists myuni_membership_plans_published_price_check;

create table if not exists public.myuni_membership_plans (
  id uuid primary key default gen_random_uuid(),
  family_code text not null default 'MYUNI_ACCESS',
  code text not null,
  version integer not null default 1 check (version > 0),
  duration_months integer not null,
  name_tr text not null,
  name_en text,
  description_tr text,
  description_en text,
  price numeric(12, 2) not null check (price >= 0),
  currency char(3) not null default 'TRY',
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  is_visible boolean not null default false,
  published_at timestamptz,
  archived_at timestamptz,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (code, version),
  check (currency = upper(currency)),
  check (
    (status = 'published' and is_visible = true and published_at is not null)
    or status <> 'published'
  )
);

alter table public.myuni_membership_plans
  add constraint myuni_membership_plans_duration_months_check
  check (duration_months between 1 and 24);

alter table public.myuni_membership_plans
  add constraint myuni_membership_plans_published_price_check
  check (status <> 'published' or price > 0);

create unique index if not exists myuni_membership_plans_one_published_code_idx
  on public.myuni_membership_plans (code)
  where status = 'published';

create index if not exists myuni_membership_plans_public_idx
  on public.myuni_membership_plans (status, is_visible, duration_months);

create table if not exists public.myuni_membership_plan_benefits (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.myuni_membership_plans(id) on delete cascade,
  resource_type text not null
    check (resource_type in ('course', 'product', 'event')),
  access_scope text not null default 'specific'
    check (access_scope in ('catalog', 'specific')),
  resource_id uuid,
  capability text not null default 'view'
    check (capability in ('view', 'participate', 'certificate')),
  label_tr text,
  label_en text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (plan_id, resource_type, access_scope, resource_id, capability),
  check (
    (access_scope = 'catalog' and resource_id is null)
    or (access_scope = 'specific' and resource_id is not null)
  )
);

create index if not exists myuni_membership_plan_benefits_plan_idx
  on public.myuni_membership_plan_benefits (plan_id, sort_order);

create unique index if not exists myuni_membership_plan_benefits_catalog_unique_idx
  on public.myuni_membership_plan_benefits (plan_id, resource_type, capability)
  where access_scope = 'catalog';

create table if not exists public.myuni_membership_passes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  user_email text,
  family_code text not null default 'MYUNI_ACCESS',
  plan_id uuid not null references public.myuni_membership_plans(id),
  source_order_id uuid references public.orders(id),
  source text not null default 'payment'
    check (source in ('payment', 'admin', 'campaign')),
  status text not null default 'active'
    check (status in ('active', 'expired', 'revoked')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  price_snapshot numeric(12, 2) not null check (price_snapshot >= 0),
  currency_snapshot char(3) not null,
  plan_snapshot jsonb not null,
  granted_by text,
  revoked_at timestamptz,
  revoked_by text,
  revoke_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  unique (source_order_id)
);

create index if not exists myuni_membership_passes_user_active_idx
  on public.myuni_membership_passes (user_id, family_code, ends_at desc)
  where status = 'active';

create index if not exists myuni_membership_passes_user_history_idx
  on public.myuni_membership_passes (user_id, ends_at desc);

create index if not exists myuni_membership_passes_plan_idx
  on public.myuni_membership_passes (plan_id);

create index if not exists myuni_membership_passes_expiry_idx
  on public.myuni_membership_passes (status, ends_at);

create table if not exists public.myuni_membership_entitlements (
  id uuid primary key default gen_random_uuid(),
  pass_id uuid not null references public.myuni_membership_passes(id) on delete cascade,
  benefit_id uuid not null references public.myuni_membership_plan_benefits(id),
  user_id text not null,
  resource_type text not null
    check (resource_type in ('course', 'product', 'event')),
  access_scope text not null
    check (access_scope in ('catalog', 'specific')),
  resource_id uuid,
  capability text not null
    check (capability in ('view', 'participate', 'certificate')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (
    (access_scope = 'catalog' and resource_id is null)
    or (access_scope = 'specific' and resource_id is not null)
  ),
  unique (pass_id, benefit_id)
);

create index if not exists myuni_membership_entitlements_lookup_idx
  on public.myuni_membership_entitlements
    (user_id, resource_type, resource_id, capability, ends_at desc)
  where revoked_at is null;

create index if not exists myuni_membership_entitlements_pass_idx
  on public.myuni_membership_entitlements (pass_id);

create table if not exists public.myuni_membership_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id text,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists myuni_membership_audit_entity_idx
  on public.myuni_membership_audit_log (entity_type, entity_id, created_at desc);

insert into public.modules (
  key, name_tr, name_en, description_tr, description_en,
  icon, category, sort_order, is_active
) values (
  'memberships',
  'Üyelik Paketleri',
  'Membership Plans',
  'Süreli üyelik paketlerini, fiyatları ve hizmet kapsamını yönetin.',
  'Manage fixed-term plans, prices and included services.',
  'CreditCard',
  'sales',
  7,
  true
)
on conflict (key) do update set
  name_tr = excluded.name_tr,
  name_en = excluded.name_en,
  description_tr = excluded.description_tr,
  description_en = excluded.description_en,
  icon = excluded.icon,
  category = excluded.category,
  is_active = true;

create or replace function public.myuni_membership_touch_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists myuni_membership_plans_touch on public.myuni_membership_plans;
create trigger myuni_membership_plans_touch
before update on public.myuni_membership_plans
for each row execute function public.myuni_membership_touch_updated_at();

drop trigger if exists myuni_membership_passes_touch on public.myuni_membership_passes;
create trigger myuni_membership_passes_touch
before update on public.myuni_membership_passes
for each row execute function public.myuni_membership_touch_updated_at();

create or replace function public.myuni_membership_clone_plan(
  p_plan_id uuid,
  p_actor_user_id text
)
returns public.myuni_membership_plans
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_source public.myuni_membership_plans;
  v_clone public.myuni_membership_plans;
begin
  select * into v_source
  from public.myuni_membership_plans
  where id = p_plan_id;

  if not found then
    raise exception 'membership_plan_not_found';
  end if;

  perform pg_advisory_xact_lock(hashtext('membership-plan:' || v_source.code));

  insert into public.myuni_membership_plans (
    family_code, code, version, duration_months, name_tr, name_en,
    description_tr, description_en, price, currency, status, is_visible,
    created_by, updated_by
  ) values (
    v_source.family_code,
    v_source.code,
    (select coalesce(max(version), 0) + 1
       from public.myuni_membership_plans where code = v_source.code),
    v_source.duration_months, v_source.name_tr, v_source.name_en,
    v_source.description_tr, v_source.description_en, v_source.price,
    v_source.currency, 'draft', false, p_actor_user_id, p_actor_user_id
  ) returning * into v_clone;

  insert into public.myuni_membership_plan_benefits (
    plan_id, resource_type, access_scope, resource_id, capability,
    label_tr, label_en, sort_order
  )
  select v_clone.id, resource_type, access_scope, resource_id, capability,
         label_tr, label_en, sort_order
  from public.myuni_membership_plan_benefits
  where plan_id = v_source.id;

  insert into public.myuni_membership_audit_log (
    actor_user_id, action, entity_type, entity_id, before_data, after_data
  ) values (
    p_actor_user_id, 'plan.cloned', 'membership_plan', v_clone.id::text,
    to_jsonb(v_source), to_jsonb(v_clone)
  );

  return v_clone;
end;
$$;

create or replace function public.myuni_membership_save_draft(
  p_plan_id uuid,
  p_payload jsonb,
  p_benefits jsonb,
  p_actor_user_id text
)
returns public.myuni_membership_plans
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_plan public.myuni_membership_plans;
  v_code text := trim(p_payload ->> 'code');
  v_duration integer := (p_payload ->> 'duration_months')::integer;
  v_price numeric(12, 2) := (p_payload ->> 'price')::numeric;
  v_currency text := upper(coalesce(nullif(trim(p_payload ->> 'currency'), ''), 'TRY'));
  v_benefit jsonb;
  v_resource_type text;
  v_scope text;
  v_resource_id uuid;
  v_capability text;
begin
  if v_code = '' or v_code !~ '^[A-Z0-9_]+$' then
    raise exception 'invalid_membership_plan_code';
  end if;
  if v_duration not between 1 and 24 then
    raise exception 'invalid_membership_duration';
  end if;
  if v_price < 0 then
    raise exception 'invalid_membership_price';
  end if;
  if length(v_currency) <> 3 then
    raise exception 'invalid_membership_currency';
  end if;
  if nullif(trim(p_payload ->> 'name_tr'), '') is null then
    raise exception 'membership_name_tr_required';
  end if;
  if jsonb_typeof(coalesce(p_benefits, '[]'::jsonb)) <> 'array' then
    raise exception 'membership_benefits_must_be_array';
  end if;

  for v_benefit in select value from jsonb_array_elements(coalesce(p_benefits, '[]'::jsonb))
  loop
    v_resource_type := v_benefit ->> 'resource_type';
    v_scope := coalesce(v_benefit ->> 'access_scope', 'specific');
    v_capability := coalesce(v_benefit ->> 'capability', 'view');
    v_resource_id := nullif(v_benefit ->> 'resource_id', '')::uuid;

    if v_resource_type not in ('course', 'product', 'event')
       or v_scope not in ('catalog', 'specific')
       or v_capability not in ('view', 'participate', 'certificate') then
      raise exception 'invalid_membership_benefit';
    end if;
    if (v_scope = 'catalog' and v_resource_id is not null)
       or (v_scope = 'specific' and v_resource_id is null) then
      raise exception 'invalid_membership_benefit_scope';
    end if;
    if v_scope = 'specific' and (
      (v_resource_type = 'course' and not exists (
        select 1 from public.myuni_courses where id = v_resource_id
      ))
      or (v_resource_type = 'product' and not exists (
        select 1 from public.myuni_products where id = v_resource_id
      ))
      or (v_resource_type = 'event' and not exists (
        select 1 from public.myuni_events where id = v_resource_id
      ))
    ) then
      raise exception 'membership_resource_not_found';
    end if;
  end loop;

  if p_plan_id is null then
    perform pg_advisory_xact_lock(hashtext('membership-plan:' || v_code));
    insert into public.myuni_membership_plans (
      family_code, code, version, duration_months, name_tr, name_en,
      description_tr, description_en, price, currency, created_by, updated_by
    ) values (
      coalesce(nullif(trim(p_payload ->> 'family_code'), ''), 'MYUNI_ACCESS'),
      v_code,
      coalesce((select max(version) + 1 from public.myuni_membership_plans where code = v_code), 1),
      v_duration,
      trim(p_payload ->> 'name_tr'),
      nullif(trim(p_payload ->> 'name_en'), ''),
      nullif(trim(p_payload ->> 'description_tr'), ''),
      nullif(trim(p_payload ->> 'description_en'), ''),
      v_price,
      v_currency,
      p_actor_user_id,
      p_actor_user_id
    ) returning * into v_plan;
  else
    select * into v_plan
    from public.myuni_membership_plans
    where id = p_plan_id
    for update;

    if not found then
      raise exception 'membership_plan_not_found';
    end if;
    if v_plan.status <> 'draft' then
      raise exception 'published_membership_plan_is_immutable';
    end if;
    if v_plan.code <> v_code or v_plan.duration_months <> v_duration then
      raise exception 'membership_plan_identity_is_immutable';
    end if;

    update public.myuni_membership_plans
    set family_code = coalesce(nullif(trim(p_payload ->> 'family_code'), ''), family_code),
        name_tr = trim(p_payload ->> 'name_tr'),
        name_en = nullif(trim(p_payload ->> 'name_en'), ''),
        description_tr = nullif(trim(p_payload ->> 'description_tr'), ''),
        description_en = nullif(trim(p_payload ->> 'description_en'), ''),
        price = v_price,
        currency = v_currency,
        updated_by = p_actor_user_id
    where id = p_plan_id
    returning * into v_plan;

    delete from public.myuni_membership_plan_benefits where plan_id = p_plan_id;
  end if;

  insert into public.myuni_membership_plan_benefits (
    plan_id, resource_type, access_scope, resource_id, capability,
    label_tr, label_en, sort_order
  )
  select
    v_plan.id,
    value ->> 'resource_type',
    coalesce(value ->> 'access_scope', 'specific'),
    nullif(value ->> 'resource_id', '')::uuid,
    coalesce(value ->> 'capability', 'view'),
    nullif(trim(value ->> 'label_tr'), ''),
    nullif(trim(value ->> 'label_en'), ''),
    coalesce((value ->> 'sort_order')::integer, ordinality::integer - 1)
  from jsonb_array_elements(coalesce(p_benefits, '[]'::jsonb)) with ordinality;

  insert into public.myuni_membership_audit_log (
    actor_user_id, action, entity_type, entity_id, after_data,
    metadata
  ) values (
    p_actor_user_id, 'plan.draft_saved', 'membership_plan', v_plan.id::text,
    to_jsonb(v_plan), jsonb_build_object('benefit_count', jsonb_array_length(coalesce(p_benefits, '[]'::jsonb)))
  );

  return v_plan;
end;
$$;

create or replace function public.myuni_membership_publish_plan(
  p_plan_id uuid,
  p_actor_user_id text
)
returns public.myuni_membership_plans
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_plan public.myuni_membership_plans;
begin
  select * into v_plan
  from public.myuni_membership_plans
  where id = p_plan_id
  for update;

  if not found then
    raise exception 'membership_plan_not_found';
  end if;
  if v_plan.status <> 'draft' then
    raise exception 'only_draft_plan_can_be_published';
  end if;
  if not exists (
    select 1 from public.myuni_membership_plan_benefits where plan_id = p_plan_id
  ) then
    raise exception 'membership_plan_requires_at_least_one_benefit';
  end if;

  perform pg_advisory_xact_lock(hashtext('membership-plan:' || v_plan.code));

  update public.myuni_membership_plans
  set status = 'archived', is_visible = false, archived_at = now(),
      updated_by = p_actor_user_id
  where code = v_plan.code and status = 'published' and id <> p_plan_id;

  update public.myuni_membership_plans
  set status = 'published', is_visible = true, published_at = now(),
      archived_at = null, updated_by = p_actor_user_id
  where id = p_plan_id
  returning * into v_plan;

  insert into public.myuni_membership_audit_log (
    actor_user_id, action, entity_type, entity_id, after_data
  ) values (
    p_actor_user_id, 'plan.published', 'membership_plan', v_plan.id::text,
    to_jsonb(v_plan)
  );

  return v_plan;
end;
$$;

create or replace function public.myuni_membership_deliver_pass(
  p_order_id text
)
returns table (
  pass_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  already_delivered boolean
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_order public.orders%rowtype;
  v_plan public.myuni_membership_plans%rowtype;
  v_existing public.myuni_membership_passes%rowtype;
  v_pass public.myuni_membership_passes%rowtype;
  v_membership jsonb;
  v_user_id text;
  v_paid_at timestamptz;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_plan_id uuid;
  v_expected_version integer;
  v_expected_duration integer;
begin
  if nullif(trim(p_order_id), '') is null then
    raise exception 'membership_order_id_required';
  end if;

  select orders.* into v_order
  from public.orders
  where orders.orderid = p_order_id
  for update;

  if not found then
    raise exception 'membership_order_not_found';
  end if;
  if v_order.status <> 'completed' then
    raise exception 'membership_order_not_completed';
  end if;
  if v_order.custom_data ->> 'itemType' <> 'membership_pass' then
    raise exception 'membership_order_item_type_invalid';
  end if;

  select passes.* into v_existing
  from public.myuni_membership_passes as passes
  where passes.source_order_id = v_order.id;

  if found then
    return query
    select v_existing.id, v_existing.starts_at, v_existing.ends_at, true;
    return;
  end if;

  v_membership := v_order.custom_data -> 'membershipPlan';
  v_user_id := nullif(v_order.custom_data ->> 'userId', '');

  if v_user_id is null or v_user_id !~ '^user_' then
    raise exception 'membership_order_user_invalid';
  end if;
  if jsonb_typeof(v_membership) <> 'object' then
    raise exception 'membership_order_snapshot_missing';
  end if;

  begin
    v_plan_id := (v_membership ->> 'planId')::uuid;
    v_expected_version := (v_membership ->> 'version')::integer;
    v_expected_duration := (v_membership ->> 'durationMonths')::integer;
    select plans.* into v_plan
    from public.myuni_membership_plans as plans
    where plans.id = v_plan_id;
  exception
    when invalid_text_representation then
      raise exception 'membership_order_snapshot_invalid';
  end;

  if not found then
    raise exception 'membership_plan_not_found';
  end if;
  if v_plan.status not in ('published', 'archived')
     or v_plan.version <> v_expected_version
     or v_plan.code <> (v_membership ->> 'code')
     or v_plan.duration_months <> v_expected_duration then
    raise exception 'membership_order_plan_mismatch';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('membership-pass:' || v_user_id || ':' || v_plan.family_code, 0)
  );

  -- Re-check after the user/family lock so a concurrent retry stays idempotent.
  select passes.* into v_existing
  from public.myuni_membership_passes as passes
  where passes.source_order_id = v_order.id;

  if found then
    return query
    select v_existing.id, v_existing.starts_at, v_existing.ends_at, true;
    return;
  end if;

  v_paid_at := coalesce(v_order.updated_at, transaction_timestamp());

  select greatest(
    v_paid_at,
    coalesce(max(passes.ends_at), v_paid_at)
  ) into v_starts_at
  from public.myuni_membership_passes as passes
  where passes.user_id = v_user_id
    and passes.family_code = v_plan.family_code
    and passes.status = 'active'
    and passes.revoked_at is null
    and passes.ends_at > v_paid_at;

  v_ends_at := v_starts_at + make_interval(months => v_plan.duration_months);
  if v_ends_at > transaction_timestamp() + interval '24 months' then
    raise exception 'membership_forward_access_limit_exceeded';
  end if;

  insert into public.myuni_membership_passes (
    user_id, user_email, family_code, plan_id, source_order_id, source,
    status, starts_at, ends_at, price_snapshot, currency_snapshot,
    plan_snapshot
  ) values (
    v_user_id,
    v_order.useremail,
    v_plan.family_code,
    v_plan.id,
    v_order.id,
    'payment',
    'active',
    v_starts_at,
    v_ends_at,
    greatest(coalesce(v_order.amount, 0), 0),
    v_plan.currency,
    jsonb_build_object(
      'id', v_plan.id,
      'familyCode', v_plan.family_code,
      'code', v_plan.code,
      'version', v_plan.version,
      'durationMonths', v_plan.duration_months,
      'nameTr', v_plan.name_tr,
      'nameEn', v_plan.name_en,
      'price', v_plan.price,
      'currency', v_plan.currency
    )
  ) returning * into v_pass;

  insert into public.myuni_membership_entitlements (
    pass_id, benefit_id, user_id, resource_type, access_scope,
    resource_id, capability, starts_at, ends_at
  )
  select
    v_pass.id, benefits.id, v_user_id, benefits.resource_type,
    benefits.access_scope, benefits.resource_id, benefits.capability,
    v_starts_at, v_ends_at
  from public.myuni_membership_plan_benefits as benefits
  where benefits.plan_id = v_plan.id;

  if not found then
    raise exception 'membership_plan_has_no_benefits';
  end if;

  insert into public.myuni_membership_audit_log (
    actor_user_id, action, entity_type, entity_id, after_data, metadata
  ) values (
    v_user_id,
    'pass.delivered',
    'membership_pass',
    v_pass.id::text,
    to_jsonb(v_pass),
    jsonb_build_object('orderId', v_order.orderid, 'orderRowId', v_order.id)
  );

  return query
  select v_pass.id, v_pass.starts_at, v_pass.ends_at, false;
end;
$$;

alter table public.myuni_membership_plans enable row level security;
alter table public.myuni_membership_plan_benefits enable row level security;
alter table public.myuni_membership_passes enable row level security;
alter table public.myuni_membership_entitlements enable row level security;
alter table public.myuni_membership_audit_log enable row level security;

drop policy if exists deny_direct_client_access on public.myuni_membership_plans;
create policy deny_direct_client_access on public.myuni_membership_plans
  for all to anon, authenticated using (false) with check (false);
drop policy if exists deny_direct_client_access on public.myuni_membership_plan_benefits;
create policy deny_direct_client_access on public.myuni_membership_plan_benefits
  for all to anon, authenticated using (false) with check (false);
drop policy if exists deny_direct_client_access on public.myuni_membership_passes;
create policy deny_direct_client_access on public.myuni_membership_passes
  for all to anon, authenticated using (false) with check (false);
drop policy if exists deny_direct_client_access on public.myuni_membership_entitlements;
create policy deny_direct_client_access on public.myuni_membership_entitlements
  for all to anon, authenticated using (false) with check (false);
drop policy if exists deny_direct_client_access on public.myuni_membership_audit_log;
create policy deny_direct_client_access on public.myuni_membership_audit_log
  for all to anon, authenticated using (false) with check (false);

revoke all on public.myuni_membership_plans from public, anon, authenticated;
revoke all on public.myuni_membership_plan_benefits from public, anon, authenticated;
revoke all on public.myuni_membership_passes from public, anon, authenticated;
revoke all on public.myuni_membership_entitlements from public, anon, authenticated;
revoke all on public.myuni_membership_audit_log from public, anon, authenticated;
grant select, insert, update, delete on public.myuni_membership_plans to service_role;
grant select, insert, update, delete on public.myuni_membership_plan_benefits to service_role;
grant select, insert, update, delete on public.myuni_membership_passes to service_role;
grant select, insert, update, delete on public.myuni_membership_entitlements to service_role;
grant select, insert, update, delete on public.myuni_membership_audit_log to service_role;
revoke all on sequence public.myuni_membership_audit_log_id_seq from public, anon, authenticated;
grant usage, select on sequence public.myuni_membership_audit_log_id_seq to service_role;
revoke all on function public.myuni_membership_touch_updated_at() from public, anon, authenticated;
revoke all on function public.myuni_membership_clone_plan(uuid, text) from public, anon, authenticated;
revoke all on function public.myuni_membership_save_draft(uuid, jsonb, jsonb, text) from public, anon, authenticated;
revoke all on function public.myuni_membership_publish_plan(uuid, text) from public, anon, authenticated;
revoke all on function public.myuni_membership_deliver_pass(text) from public, anon, authenticated;
grant execute on function public.myuni_membership_clone_plan(uuid, text) to service_role;
grant execute on function public.myuni_membership_save_draft(uuid, jsonb, jsonb, text) to service_role;
grant execute on function public.myuni_membership_publish_plan(uuid, text) to service_role;
grant execute on function public.myuni_membership_deliver_pass(text) to service_role;

do $$
declare
  target regclass;
begin
  foreach target in array array[
    'public.myuni_membership_plans'::regclass,
    'public.myuni_membership_plan_benefits'::regclass,
    'public.myuni_membership_passes'::regclass,
    'public.myuni_membership_entitlements'::regclass,
    'public.myuni_membership_audit_log'::regclass
  ]
  loop
    if has_table_privilege('anon', target, 'SELECT')
       or has_table_privilege('anon', target, 'INSERT')
       or has_table_privilege('anon', target, 'UPDATE')
       or has_table_privilege('anon', target, 'DELETE')
       or has_table_privilege('authenticated', target, 'SELECT')
       or has_table_privilege('authenticated', target, 'INSERT')
       or has_table_privilege('authenticated', target, 'UPDATE')
       or has_table_privilege('authenticated', target, 'DELETE') then
      raise exception 'Direct client privilege is still effective on %', target;
    end if;
    if not has_table_privilege('service_role', target, 'SELECT')
       or not has_table_privilege('service_role', target, 'INSERT')
       or not has_table_privilege('service_role', target, 'UPDATE')
       or not has_table_privilege('service_role', target, 'DELETE') then
      raise exception 'Service role CRUD privilege is missing on %', target;
    end if;
  end loop;

  if has_function_privilege('anon', 'public.myuni_membership_deliver_pass(text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.myuni_membership_deliver_pass(text)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.myuni_membership_deliver_pass(text)', 'EXECUTE') then
    raise exception 'Membership delivery RPC privileges are invalid';
  end if;
end;
$$;

commit;
