import 'server-only';
import { unstable_cache } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const MEMBERSHIP_PLAN_CACHE_SECONDS = 60;

export type PublishedMembershipBenefit = {
  id: string;
  plan_id: string;
  resource_type: 'course' | 'product' | 'event';
  access_scope: 'catalog' | 'specific';
  resource_id: string | null;
  capability: 'view' | 'participate' | 'certificate';
  label_tr: string | null;
  label_en: string | null;
  sort_order: number;
};

export type PublishedMembershipPlan = {
  id: string;
  code: string;
  version: number;
  duration_months: number;
  name_tr: string;
  name_en: string | null;
  description_tr: string | null;
  description_en: string | null;
  price: number;
  currency: string;
  published_at: string;
  benefits: PublishedMembershipBenefit[];
};

async function loadPublishedMembershipPlans(): Promise<PublishedMembershipPlan[]> {
  const { data: plans, error } = await supabaseAdmin
    .from('myuni_membership_plans')
    .select(
      `
        id, code, version, duration_months, name_tr, name_en,
        description_tr, description_en, price, currency, published_at,
        benefits:myuni_membership_plan_benefits(
          id, plan_id, resource_type, access_scope, resource_id,
          capability, label_tr, label_en, sort_order
        )
      `
    )
    .eq('status', 'published')
    .eq('is_visible', true)
    .order('duration_months', { ascending: true });

  if (error) throw error;

  return (plans ?? []).map((plan) => ({
    ...plan,
    price: Number(plan.price),
    benefits: ((plan.benefits ?? []) as PublishedMembershipBenefit[]).sort(
      (left, right) => left.sort_order - right.sort_order
    ),
  })) as PublishedMembershipPlan[];
}

export const getPublishedMembershipPlans = unstable_cache(
  loadPublishedMembershipPlans,
  ['published-membership-plans-v1'],
  { revalidate: MEMBERSHIP_PLAN_CACHE_SECONDS, tags: ['membership-plans'] }
);
