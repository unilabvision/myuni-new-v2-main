import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface UserProfileData {
  clerk_id: string;
  first_name: string;
  last_name: string;
  email: string;
  school?: string | null;
  grade?: string | null;
  bio?: string | null;
  phone_number?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: UserProfileData = await request.json();
    
    const { clerk_id, first_name, last_name, email, school, grade, bio, phone_number } = body;

    if (!clerk_id || !first_name || !last_name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: clerk_id, first_name, last_name, email' },
        { status: 400 }
      );
    }

    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('clerk_id', clerk_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is expected for new users
      console.error('Error checking existing profile:', checkError);
    }

    let result;

    if (existingProfile) {
      // Update existing profile
      result = await supabaseAdmin
        .from('user_profiles')
        .update({
          first_name,
          last_name,
          email,
          school: school || null,
          grade: grade || null,
          bio: bio || null,
          phone_number: phone_number || null,
          updated_at: new Date().toISOString()
        })
        .eq('clerk_id', clerk_id)
        .select()
        .single();
    } else {
      // Insert new profile
      result = await supabaseAdmin
        .from('user_profiles')
        .insert({
          clerk_id,
          first_name,
          last_name,
          email,
          school: school || null,
          grade: grade || null,
          bio: bio || null,
          phone_number: phone_number || null
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error saving user profile:', result.error);
      return NextResponse.json(
        { error: 'Failed to save user profile', details: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: result.data
    });

  } catch (error) {
    console.error('User profile API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clerk_id = searchParams.get('clerk_id');

    if (!clerk_id) {
      return NextResponse.json(
        { error: 'Missing clerk_id parameter' },
        { status: 400 }
      );
    }

    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('clerk_id', clerk_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching user profile:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('User profile GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
