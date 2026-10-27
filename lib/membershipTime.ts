export type MembershipTemporalState = 'active' | 'upcoming' | 'expired' | 'revoked';

export type MembershipPeriod = {
  status: string;
  starts_at: string;
  ends_at: string;
  revoked_at?: string | null;
};

export function getMembershipTemporalState(
  pass: MembershipPeriod,
  now: Date = new Date()
): MembershipTemporalState {
  if (pass.status === 'revoked' || pass.revoked_at) return 'revoked';
  if (pass.status === 'expired') return 'expired';

  const timestamp = now.getTime();
  if (timestamp < new Date(pass.starts_at).getTime()) return 'upcoming';
  if (timestamp >= new Date(pass.ends_at).getTime()) return 'expired';
  return 'active';
}

export function getRemainingDays(endsAt: string, now: Date = new Date()): number {
  const remainingMilliseconds = new Date(endsAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(remainingMilliseconds / 86_400_000));
}
