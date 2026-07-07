import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import {
  resolveApplicationContext,
  submitApplication,
} from '@/lib/applicationService';
import type { ApplicationContextType } from '@/lib/types/application';

const VALID_CONTEXT_TYPES: ApplicationContextType[] = [
  'opportunity',
  'event',
  'club',
  'campaign',
  'generic',
];

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Giriş yapmalısınız' }, { status: 401 });
    }

    const user = await currentUser();
    const email =
      user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() ?? null;

    const body = await request.json();
    const {
      context_type,
      context_id,
      context_slug,
      submission_data = {},
      cv_storage_path,
      cv_file_name,
      user_agent,
      form_config_id,
    } = body;

    if (!context_type || !VALID_CONTEXT_TYPES.includes(context_type)) {
      return NextResponse.json(
        { error: 'Geçersiz context_type' },
        { status: 400 }
      );
    }

    if (!context_id && !context_slug) {
      return NextResponse.json(
        { error: 'context_id veya context_slug gerekli' },
        { status: 400 }
      );
    }

    const context = await resolveApplicationContext(context_type, {
      contextId: context_id,
      contextSlug: context_slug,
    });

    if (context?.requiresAuth && !userId) {
      return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
    }

    const result = await submitApplication({
      contextType: context_type,
      contextId: context_id,
      contextSlug: context_slug,
      userId,
      applicantEmail: email,
      submissionData: submission_data,
      cvStoragePath: cv_storage_path,
      cvFileName: cv_file_name,
      userAgent: user_agent,
      formConfigId: form_config_id,
    });

    if (!result.success) {
      const status =
        result.error?.includes('zaten') ? 409 :
        result.error?.includes('koşul') ? 403 :
        result.error?.includes('bulunamadı') ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      success: true,
      application: result.application,
      applicationId: result.application?.id,
      message: 'Başvurunuz başarıyla alındı',
    });
  } catch (error) {
    console.error('[api/applications/submit] POST:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
