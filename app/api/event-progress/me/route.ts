import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getUserEventProgress,
  getUserEventLessonProgress,
  getEventCompletionStats,
  getLatestEventQuizResult,
  generateUserEventAnalytics,
} from '@/lib/eventProgressService';

/**
 * GET /api/event-progress/me
 * - ?eventId= → event progress list
 * - ?sectionId= → single section/lesson progress
 * - ?eventId=&stats=1 → completion stats
 * - ?eventId=&analytics=1 → analytics
 * - ?quizSectionId= → latest quiz result
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const eventId = params.get('eventId');
    const sectionId = params.get('sectionId');
    const quizSectionId = params.get('quizSectionId');
    const stats = params.get('stats');
    const analytics = params.get('analytics');

    if (quizSectionId) {
      const data = await getLatestEventQuizResult(userId, quizSectionId);
      return NextResponse.json({ success: true, data });
    }

    if (sectionId) {
      const data = await getUserEventLessonProgress(userId, sectionId);
      return NextResponse.json({ success: true, data });
    }

    if (eventId && stats === '1') {
      const data = await getEventCompletionStats(userId, eventId);
      return NextResponse.json({ success: true, data });
    }

    if (eventId && analytics === '1') {
      const data = await generateUserEventAnalytics(userId, eventId);
      return NextResponse.json({ success: true, data });
    }

    if (eventId) {
      const data = await getUserEventProgress(userId, eventId);
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json(
      { success: false, error: 'eventId, sectionId, or quizSectionId is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('GET /api/event-progress/me error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
