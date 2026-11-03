import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getIdentityAdminClient } from '@/lib/supabase/adminDatabases';

interface UserProfileInput {
  first_name?: string;
  last_name?: string;
  school?: string | null;
  grade?: string | null;
  bio?: string | null;
  phone_number?: string | null;
}

const PROFILE_COLUMNS =
  'id, clerk_id, first_name, last_name, email, school, grade, bio, phone_number, created_at, updated_at';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [body, user] = await Promise.all([
      request.json() as Promise<UserProfileInput>,
      currentUser(),
    ]);
    const firstName = body.first_name?.trim();
    const lastName = body.last_name?.trim();
    const email = user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase();

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'First name, last name and verified Clerk email are required' },
        { status: 400 }
      );
    }

    const supabase = getIdentityAdminClient();
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          clerk_id: userId,
          first_name: firstName,
          last_name: lastName,
          email,
          school: body.school?.trim() || null,
          grade: body.grade?.trim() || null,
          bio: body.bio?.trim() || null,
          phone_number: body.phone_number?.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'clerk_id' }
      )
      .select(PROFILE_COLUMNS)
      .single();

    if (error) {
      console.error('[user-profile] Save failed:', error.message);
      return NextResponse.json({ error: 'Failed to save user profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (error) {
    console.error(
      '[user-profile] Request failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = getIdentityAdminClient();
    const { data, error } = await supabase
      .from('user_profiles')
      .select(PROFILE_COLUMNS)
      .eq('clerk_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[user-profile] Read failed:', error.message);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    return NextResponse.json(
      { success: true, profile: data },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    console.error(
      '[user-profile] Request failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
