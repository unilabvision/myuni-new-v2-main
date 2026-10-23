import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

import { createClerkSupabaseClient } from '@/lib/supabase/clerk-client';

type JwtClaims = Record<string, unknown>;

function decodeJwtClaims(token: string): JwtClaims {
  const payload = token.split('.')[1];
  if (!payload) return {};

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as JwtClaims;
  } catch {
    return {};
  }
}

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const token = await getToken();
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Supabase Clerk token was not issued' },
      { status: 401 }
    );
  }

  const claims = decodeJwtClaims(token);
  const targetUserId = request.nextUrl.searchParams.get('userId') || userId;
  const supabase = createClerkSupabaseClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('clerk_id')
    .eq('clerk_id', targetUserId)
    .maybeSingle();

  return NextResponse.json({
    success: true,
    checks: {
      hasAuthenticatedRole: claims.role === 'authenticated',
      clerkSub: userId,
      tokenSub: claims.sub ?? null,
      subMatches: claims.sub === userId,
      supabaseAcceptedToken: !error,
      requestedUserId: targetUserId,
      requestedProfileVisible: Boolean(data),
      otherUserBlocked: targetUserId !== userId && !data,
    },
    supabaseError: error?.message ?? null,
  });
}
