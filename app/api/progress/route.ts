import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { assertUserCanAccessLesson, CourseAccessError } from '@/lib/courseAccess';
import { buildClientProgressUpdate } from '@/lib/progressPolicy';
import { updateUserProgress, markLessonCompleted } from '@/lib/progressService';

/**
 * PATCH /api/progress
 * Body: { lessonId, watch_time_seconds?, last_position_seconds?, is_completed?, notes?,
 *         video_watch_count?, last_video_watch_at? }
 * Or: { lessonId, markCompleted: true, watch_time_seconds? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const lessonId = String(body.lessonId || '').trim();
    if (!lessonId) {
      return NextResponse.json({ success: false, error: 'lessonId is required' }, { status: 400 });
    }

    await assertUserCanAccessLesson(userId, lessonId);

    if (body.markCompleted === true) {
      const data = await markLessonCompleted(
        userId,
        lessonId,
        typeof body.watch_time_seconds === 'number' ? body.watch_time_seconds : undefined
      );
      return NextResponse.json({ success: true, data });
    }

    const progressData = buildClientProgressUpdate(body);

    if (Object.keys(progressData).length === 0) {
      return NextResponse.json({ success: false, error: 'No updates provided' }, { status: 400 });
    }

    const data = await updateUserProgress(userId, lessonId, progressData);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof CourseAccessError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      );
    }
    console.error('PATCH /api/progress error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
