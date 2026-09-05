import { NextRequest, NextResponse } from 'next/server';
import {
  submitMentorshipApplication,
  type MentorshipApplyInput,
} from '@/lib/mentorshipService';

/** Site başvuru formu → mentorship_applications (paylaşılan DB) */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MentorshipApplyInput;
    const result = await submitMentorshipApplication(body);

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }

    return NextResponse.json(
      { success: true, application: result.application },
      { status: 201 }
    );
  } catch (err) {
    console.error('Public mentorship apply error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
