import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * GET /api/certificates/me — list user's course + event certificates
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const [courseResult, eventResult] = await Promise.all([
      supabaseAdmin
        .from('myuni_certificates')
        .select(`*, course:myuni_courses(*)`)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('issue_date', { ascending: false }),
      supabaseAdmin
        .from('myuni_event_certificates')
        .select(`*, event:myuni_events(*)`)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('issue_date', { ascending: false }),
    ]);

    if (courseResult.error) {
      return NextResponse.json({ success: false, error: courseResult.error.message }, { status: 500 });
    }
    if (eventResult.error) {
      return NextResponse.json({ success: false, error: eventResult.error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      courseCertificates: courseResult.data || [],
      eventCertificates: eventResult.data || [],
    });
  } catch (error) {
    console.error('GET /api/certificates/me error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
