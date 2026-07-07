import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { submitApplication } from '@/lib/applicationService';
import { getOpportunityBySlug } from '@/lib/opportunityService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Giriş yapmalısınız' }, { status: 401 });
    }

    const user = await currentUser();
    const email =
      user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() ?? null;

    const { slug } = await params;
    const body = await request.json();
    const {
      submission_data = {},
      cv_storage_path,
      cv_file_name,
      user_agent,
    } = body;

    const opportunity = await getOpportunityBySlug(slug);
    if (!opportunity) {
      return NextResponse.json({ error: 'İlan bulunamadı' }, { status: 404 });
    }

    const result = await submitApplication({
      contextType: 'opportunity',
      contextSlug: slug,
      userId,
      applicantEmail: email,
      submissionData: submission_data as Record<string, unknown>,
      cvStoragePath: cv_storage_path,
      cvFileName: cv_file_name,
      userAgent: user_agent,
    });

    if (!result.success) {
      const status =
        result.error?.includes('zaten') ? 409 :
        result.error?.includes('koşul') || result.error?.includes('eğitim') ? 403 :
        result.error?.includes('süresi') ? 400 :
        result.error?.includes('bulunamadı') ? 404 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      success: true,
      application: result.application,
      applicationId: result.application?.id,
      message: 'Başvurunuz başarıyla alındı',
    });
  } catch (error) {
    console.error('[api/opportunities/apply] POST:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
