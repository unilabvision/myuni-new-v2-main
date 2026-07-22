import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { saveEventQuizResult } from '@/lib/eventProgressService';

/**
 * POST /api/event-progress/quiz
 * Body: { sectionId, quickId, score }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const sectionId = String(body.sectionId || body.lessonId || '').trim();
    const quickId = String(body.quickId || '').trim();
    const score = Number(body.score);

    if (!sectionId || !quickId || Number.isNaN(score)) {
      return NextResponse.json(
        { success: false, error: 'sectionId, quickId, and score are required' },
        { status: 400 }
      );
    }

    const data = await saveEventQuizResult(userId, sectionId, quickId, score);
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('POST /api/event-progress/quiz error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
