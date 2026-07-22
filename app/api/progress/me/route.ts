import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getUserCourseProgress,
  getUserLessonProgress,
  getCourseCompletionStats,
  getLatestQuizResult,
  generateUserAnalytics,
} from '@/lib/progressService';

/**
 * GET /api/progress/me
 * - ?courseId= → course progress list
 * - ?lessonId= → single lesson progress
 * - ?courseId=&stats=1 → completion stats
 * - ?courseId=&analytics=1 → analytics
 * - ?quickId= → latest quiz result
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const courseId = params.get('courseId');
    const lessonId = params.get('lessonId');
    const quickId = params.get('quickId');
    const stats = params.get('stats');
    const analytics = params.get('analytics');

    if (quickId) {
      const data = await getLatestQuizResult(userId, quickId);
      return NextResponse.json({ success: true, data });
    }

    if (lessonId) {
      const data = await getUserLessonProgress(userId, lessonId);
      return NextResponse.json({ success: true, data });
    }

    if (courseId && stats === '1') {
      const data = await getCourseCompletionStats(userId, courseId);
      return NextResponse.json({ success: true, data });
    }

    if (courseId && analytics === '1') {
      const data = await generateUserAnalytics(userId, courseId);
      return NextResponse.json({ success: true, data });
    }

    if (courseId) {
      const data = await getUserCourseProgress(userId, courseId);
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json(
      { success: false, error: 'courseId, lessonId, or quickId is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('GET /api/progress/me error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
