import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserApplications } from '@/lib/applicationService';
import type { ApplicationContextType } from '@/lib/types/application';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contextType = new URL(request.url).searchParams.get(
      'context_type'
    ) as ApplicationContextType | null;

    const applications = await getUserApplications(
      userId,
      contextType || undefined
    );

    return NextResponse.json({ success: true, applications });
  } catch (error) {
    console.error('[api/applications/my] GET:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
