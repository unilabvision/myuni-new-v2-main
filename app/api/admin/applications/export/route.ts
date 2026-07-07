import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { exportApplicationsCsv } from '@/lib/applicationService';
import type { ApplicationContextType, ApplicationStatus } from '@/lib/types/application';

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const contextType = searchParams.get('context_type') as ApplicationContextType | null;
  const status = searchParams.get('status') as ApplicationStatus | null;

  const csv = await exportApplicationsCsv({
    contextType: contextType || undefined,
    status: status || undefined,
  });

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="basvurular-${Date.now()}.csv"`,
    },
  });
}
