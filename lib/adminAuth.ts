import { currentUser } from '@clerk/nextjs/server';
import { auth } from '@clerk/nextjs/server';

/**
 * Comma-separated list of admin emails. If not set, any signed-in user is allowed (dev only).
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
  if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(email)) {
    return null;
  }

  return { userId, email };
}

export function isAdminEmail(email: string): boolean {
  if (ADMIN_EMAILS.length === 0) return true;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
