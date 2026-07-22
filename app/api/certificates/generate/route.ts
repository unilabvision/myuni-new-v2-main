import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateCertificate } from '@/lib/certificateService';

/**
 * POST /api/certificates/generate
 * Body: itemId, itemType, itemName, instructorName, duration, organization,
 *       organizationDescription, instructorBio, userFullName?, forceGenerate?
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const itemId = String(body.itemId || '').trim();
    const itemType = body.itemType === 'event' ? 'event' : 'course';

    if (!itemId) {
      return NextResponse.json({ success: false, error: 'itemId is required' }, { status: 400 });
    }

    const data = await generateCertificate(
      {
        userId,
        itemId,
        itemType,
        itemName: String(body.itemName || ''),
        instructorName: String(body.instructorName || ''),
        duration: String(body.duration || ''),
        organization: String(body.organization || ''),
        organizationDescription: String(body.organizationDescription || ''),
        instructorBio: String(body.instructorBio || ''),
        userFullName: body.userFullName ? String(body.userFullName) : undefined,
      },
      body.forceGenerate === true
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('POST /api/certificates/generate error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
