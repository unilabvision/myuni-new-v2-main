import 'server-only';
import { currentUser } from '@clerk/nextjs/server';

export async function getVerifiedProductAccessEmails(): Promise<string[]> {
  try {
    const user = await currentUser();
    if (!user) return [];

    return [...new Set(
      user.emailAddresses
        .filter((entry) => entry.verification?.status === 'verified')
        .map((entry) => entry.emailAddress.trim().toLowerCase())
        .filter(Boolean)
    )];
  } catch (error) {
    console.error('Unable to resolve verified email for product access:', error);
    return [];
  }
}
