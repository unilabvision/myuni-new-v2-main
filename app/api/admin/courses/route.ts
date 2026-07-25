import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getAllCoursesForAdmin } from '@/lib/opportunityService';

/**
 * GET – Active courses for admin discount course picker.
 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const courses = await getAllCoursesForAdmin();
    return NextResponse.json({ success: true, data: courses });
  } catch (e) {
    console.error('Admin courses list error:', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
