import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * GET /api/event-competitions?lessonId=
 * Returns competition config + whether the auth user already submitted.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const lessonId = request.nextUrl.searchParams.get('lessonId');
    if (!lessonId) {
      return NextResponse.json({ success: false, error: 'lessonId is required' }, { status: 400 });
    }

    const { data: competition, error } = await supabaseAdmin
      .from('myuni_event_competitions')
      .select('*')
      .eq('lesson_id', lessonId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!competition) {
      return NextResponse.json({
        success: true,
        competition: null,
        hasCompleted: false,
        message: 'No active competition for this lesson',
      });
    }

    const { data: previousResult } = await supabaseAdmin
      .from('myuni_event_competition_results')
      .select('id')
      .eq('competition_id', competition.id)
      .eq('user_id', userId)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      competition,
      hasCompleted: !!previousResult,
    });
  } catch (error) {
    console.error('GET /api/event-competitions error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
