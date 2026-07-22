import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { saveQuizResult } from '@/lib/progressService';

/**
 * POST /api/progress/quiz
 * Body: { lessonId, quickId, score }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const lessonId = String(body.lessonId || '').trim();
    const quickId = String(body.quickId || '').trim();
    const score = Number(body.score);

    if (!lessonId || !quickId || Number.isNaN(score)) {
      return NextResponse.json(
        { success: false, error: 'lessonId, quickId, and score are required' },
        { status: 400 }
      );
    }

    const data = await saveQuizResult(userId, lessonId, quickId, score);
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('POST /api/progress/quiz error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
