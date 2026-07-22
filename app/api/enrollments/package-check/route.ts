import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * GET /api/enrollments/package-check?packageId=
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const packageId = request.nextUrl.searchParams.get('packageId');
    if (!packageId) {
      return NextResponse.json({ success: false, error: 'packageId is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('myuni_package_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('package_id', packageId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Package enrollment check error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, isEnrolled: !!data });
  } catch (error) {
    console.error('GET /api/enrollments/package-check error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
