import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { exportApplicationsCsv } from '@/lib/applicationService';
import type { ApplicationStatus } from '@/lib/types/application';

/** @deprecated Use /api/admin/applications/export?context_type=opportunity */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as ApplicationStatus | null;

  const csv = await exportApplicationsCsv({
    contextType: 'opportunity',
    status: status || undefined,
  });

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="staj-basvurulari-${Date.now()}.csv"`,
    },
  });
}
