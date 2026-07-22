import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  checkCertificateEligibility,
  checkEventCertificateEligibility,
} from '@/lib/certificateService';

/**
 * GET /api/certificates/eligibility?courseId= | ?eventId=
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const courseId = request.nextUrl.searchParams.get('courseId');
    const eventId = request.nextUrl.searchParams.get('eventId');

    if (courseId) {
      const data = await checkCertificateEligibility(userId, courseId);
      return NextResponse.json({ success: true, data });
    }

    if (eventId) {
      const data = await checkEventCertificateEligibility(userId, eventId);
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json(
      { success: false, error: 'courseId or eventId is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('GET /api/certificates/eligibility error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
