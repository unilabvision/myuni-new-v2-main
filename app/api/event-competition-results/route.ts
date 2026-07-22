import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { updateUserEventProgress } from '@/lib/eventProgressService';

/**
 * POST /api/event-competition-results
 * Body: { competitionId, lessonId, score, timeTakenSeconds, answers }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const competitionId = String(body.competitionId || '').trim();
    const lessonId = String(body.lessonId || '').trim();
    const timeTakenSeconds = Number(body.timeTakenSeconds ?? body.time_taken_seconds ?? 0);
    const answers = body.answers || body.user_answers || {};

    if (!competitionId) {
      return NextResponse.json(
        { success: false, error: 'competitionId is required' },
        { status: 400 }
      );
    }

    const { data: existing } = await supabaseAdmin
      .from('myuni_event_competition_results')
      .select('id')
      .eq('competition_id', competitionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Already submitted' },
        { status: 409 }
      );
    }

    const { data: competition, error: competitionError } = await supabaseAdmin
      .from('myuni_event_competitions')
      .select('id, questions')
      .eq('id', competitionId)
      .eq('is_active', true)
      .maybeSingle();

    if (competitionError || !competition) {
      return NextResponse.json({ success: false, error: 'Competition not found' }, { status: 404 });
    }

    const questions = Array.isArray(competition.questions) ? competition.questions : [];
    let calculatedScore = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correct_option_id) {
        calculatedScore += q.points || 10;
      }
    }

    const { error: insertError } = await supabaseAdmin
      .from('myuni_event_competition_results')
      .insert({
        competition_id: competitionId,
        user_id: userId,
        score: calculatedScore,
        time_taken_seconds: timeTakenSeconds,
        user_answers: answers,
        started_at: new Date(Date.now() - timeTakenSeconds * 1000).toISOString(),
        completed_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Competition result insert error:', insertError);
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    if (lessonId) {
      await updateUserEventProgress(userId, lessonId, {
        is_completed: true,
        watch_time_seconds: timeTakenSeconds,
      });
    }

    return NextResponse.json({
      success: true,
      score: calculatedScore,
    });
  } catch (error) {
    console.error('POST /api/event-competition-results error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
