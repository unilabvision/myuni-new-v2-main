import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { listApplicationsForAdmin } from '@/lib/applicationService';
import type { ApplicationStatus } from '@/lib/types/application';

/** @deprecated Use /api/admin/applications?context_type=opportunity */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ApplicationStatus | null;
    const opportunityId = searchParams.get('opportunity_id');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const result = await listApplicationsForAdmin({
      contextType: 'opportunity',
      status: status || undefined,
      contextId: opportunityId || undefined,
      limit,
    });

    const applications = result.applications.map((app) => ({
      ...app,
      opportunity_id: app.context_id,
      opportunity: app.opportunity,
    }));

    return NextResponse.json({
      success: true,
      applications,
      statusCounts: result.statusCounts,
    });
  } catch (error) {
    console.error('[admin/opportunity-applications] GET:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
