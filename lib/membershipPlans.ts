import 'server-only';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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

export async function getPublishedMembershipPlans(): Promise<PublishedMembershipPlan[]> {
  const { data: plans, error: plansError } = await supabaseAdmin
    .from('myuni_membership_plans')
    .select(
      'id, code, version, duration_months, name_tr, name_en, description_tr, description_en, price, currency, published_at'
    )
    .eq('status', 'published')
    .eq('is_visible', true)
    .order('duration_months', { ascending: true });

  if (plansError) throw plansError;
  if (!plans?.length) return [];

  const planIds = plans.map((plan) => plan.id);
  const { data: benefits, error: benefitsError } = await supabaseAdmin
    .from('myuni_membership_plan_benefits')
    .select(
      'id, plan_id, resource_type, access_scope, resource_id, capability, label_tr, label_en, sort_order'
    )
    .in('plan_id', planIds)
    .order('sort_order', { ascending: true });

  if (benefitsError) throw benefitsError;

  const benefitsByPlan = new Map<string, PublishedMembershipBenefit[]>();
  for (const benefit of (benefits ?? []) as PublishedMembershipBenefit[]) {
    const planBenefits = benefitsByPlan.get(benefit.plan_id) ?? [];
    planBenefits.push(benefit);
    benefitsByPlan.set(benefit.plan_id, planBenefits);
  }

  return plans.map((plan) => ({
    ...plan,
    price: Number(plan.price),
    benefits: benefitsByPlan.get(plan.id) ?? [],
  })) as PublishedMembershipPlan[];
}
