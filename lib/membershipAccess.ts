import 'server-only';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type MembershipResourceType = 'course' | 'product' | 'event';
export type MembershipCapability = 'view' | 'participate' | 'certificate';

export type MembershipEntitlementAccess = {
  hasAccess: boolean;
  endsAt: string | null;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getMembershipEntitlementAccess(params: {
  userId: string;
  resourceType: MembershipResourceType;
  resourceId: string;
  capability?: MembershipCapability;
  now?: Date;
}): Promise<MembershipEntitlementAccess> {
  if (!UUID_PATTERN.test(params.resourceId)) {
    return { hasAccess: false, endsAt: null };
  }

  const nowIso = (params.now ?? new Date()).toISOString();
  const { data, error } = await supabaseAdmin
    .from('myuni_membership_entitlements')
    .select('access_scope, resource_id, ends_at')
    .eq('user_id', params.userId)
    .eq('resource_type', params.resourceType)
    .eq('capability', params.capability ?? 'view')
    .or(`access_scope.eq.catalog,resource_id.eq.${params.resourceId}`)
    .is('revoked_at', null)
    .lte('starts_at', nowIso)
    .gt('ends_at', nowIso)
    .order('ends_at', { ascending: false })
    .limit(1);

  if (error) throw error;

  const entitlement = data?.[0];
  return {
    hasAccess: Boolean(entitlement),
    endsAt: entitlement?.ends_at ?? null,
  };
}
