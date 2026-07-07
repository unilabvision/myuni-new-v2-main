import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import {
  getApplicationById,
  updateApplicationStatus,
} from '@/lib/applicationService';
import type { ApplicationStatus } from '@/lib/types/application';

const VALID_STATUSES: ApplicationStatus[] = [
  'pending',
  'under_review',
  'accepted',
  'rejected',
  'cancelled',
];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const result = await getApplicationById(id);

  if (!result) {
    return NextResponse.json({ error: 'Başvuru bulunamadı' }, { status: 404 });
  }

  return NextResponse.json({ success: true, ...result });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, admin_notes, notify_applicant = true } = body;

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Geçersiz durum' }, { status: 400 });
    }

    const result = await updateApplicationStatus(
      id,
      {
        status,
        adminNotes: admin_notes,
        notifyApplicant: notify_applicant,
      },
      admin
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Güncelleme başarısız' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, application: result.application });
  } catch (error) {
    console.error('[admin/applications/id] PATCH:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
