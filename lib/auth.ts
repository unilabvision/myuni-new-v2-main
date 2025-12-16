// lib/auth.ts
import { currentUser } from '@clerk/nextjs/server';
import { auth } from '@clerk/nextjs/server';
import type { User } from '@clerk/nextjs/server';

export async function getCurrentUser() {
  try {
    const user = await currentUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function getCurrentUserId() {
  try {
    const { userId } = await auth();
    return userId;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}

// Transform Clerk user to our user format
export function transformClerkUser(clerkUser: User | null) {
  if (!clerkUser) return null;
  
  return {
    id: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress || '',
    firstName: clerkUser.firstName || '',
    lastName: clerkUser.lastName || '',
    fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
    imageUrl: clerkUser.imageUrl || '',
    createdAt: clerkUser.createdAt
  };
}