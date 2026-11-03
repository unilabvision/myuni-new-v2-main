import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { buildTrustedCertificateData } from '@/lib/certificatePolicy';
import { generateCertificate } from '@/lib/certificateService';

/**
 * POST /api/certificates/generate
 * Body: itemId, itemType, itemName, instructorName, duration, organization,
 *       organizationDescription, instructorBio, userFullName?
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

    const user = await currentUser();
    const verifiedUserEmail = user?.primaryEmailAddress?.emailAddress;
    const verifiedUserName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
    const table = itemType === 'event' ? 'myuni_events' : 'myuni_courses';
    const { supabaseAdmin } = await import('@/lib/supabaseAdmin');
    const { data: item, error: itemError } = await supabaseAdmin
      .from(table)
      .select(
        itemType === 'event'
          ? 'id, title, organizer_name, duration'
          : 'id, title, instructor_name, instructor_description, duration',
      )
      .eq('id', itemId)
      .maybeSingle();

    if (itemError || !item) {
      return NextResponse.json({ success: false, error: 'Certificate item not found' }, { status: 404 });
    }

    const itemRecord = item as unknown as Record<string, unknown>;
    const data = await generateCertificate(
      buildTrustedCertificateData({
        userId,
        itemId,
        itemType,
        item: itemRecord,
        verifiedUserName,
      }),
      verifiedUserEmail
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('POST /api/certificates/generate error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
