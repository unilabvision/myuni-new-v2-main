import { currentUser } from '@clerk/nextjs/server';
import { auth } from '@clerk/nextjs/server';

/**
 * Comma-separated list of admin emails.
 * MUST be set in production — if empty, no one has admin access (fail-closed).
 */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function requireAdmin(): Promise<{ userId: string; email: string } | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  if (!user) return null;

  const email = user.emailAddresses?.[0]?.emailAddress?.toLowerCase() ?? '';

  // Fail-closed: ADMIN_EMAILS tanımsızsa hiç kimse admin değil
  if (ADMIN_EMAILS.length === 0 || !ADMIN_EMAILS.includes(email)) {
    return null;
  }

  return { userId, email };
}

export function isAdminEmail(email: string): boolean {
  // Fail-closed: ADMIN_EMAILS tanımsızsa hiç kimse admin değil
  if (ADMIN_EMAILS.length === 0) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

