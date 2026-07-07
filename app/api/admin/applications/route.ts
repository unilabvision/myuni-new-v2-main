import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { listApplicationsForAdmin } from '@/lib/applicationService';
import type { ApplicationContextType, ApplicationStatus } from '@/lib/types/application';

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const contextType = searchParams.get('context_type') as ApplicationContextType | null;
    const status = searchParams.get('status') as ApplicationStatus | null;
    const contextId = searchParams.get('context_id');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const result = await listApplicationsForAdmin({
      contextType: contextType || undefined,
      status: status || undefined,
      contextId: contextId || undefined,
      limit,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[admin/applications] GET:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
