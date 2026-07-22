import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateUserEventProgress, markEventLessonCompleted } from '@/lib/eventProgressService';

/**
 * PATCH /api/event-progress
 * Body: { sectionId | lessonId, ...progress fields }
 * Or: { sectionId, markCompleted: true }
 */
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const sectionId = String(body.sectionId || body.lessonId || '').trim();
    if (!sectionId) {
      return NextResponse.json(
        { success: false, error: 'sectionId or lessonId is required' },
        { status: 400 }
      );
    }

    if (body.markCompleted === true) {
      const data = await markEventLessonCompleted(
        userId,
        sectionId,
        typeof body.watch_time_seconds === 'number' ? body.watch_time_seconds : undefined
      );
      return NextResponse.json({ success: true, data });
    }

    const progressData: Record<string, unknown> = {};
    const fields = [
      'watch_time_seconds',
      'is_completed',
      'last_position_seconds',
      'notes',
      'quiz_score',
      'quiz_attempts',
      'last_quiz_attempt_at',
      'video_watch_count',
      'last_video_watch_at',
    ] as const;

    for (const field of fields) {
      if (body[field] !== undefined) {
        progressData[field] = body[field];
      }
    }

    if (Object.keys(progressData).length === 0) {
      return NextResponse.json({ success: false, error: 'No updates provided' }, { status: 400 });
    }

    const data = await updateUserEventProgress(userId, sectionId, progressData);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('PATCH /api/event-progress error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
