import { NextResponse } from 'next/server';
import { getCourseTiers } from '@/lib/courseService';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    if (!courseId) {
      return NextResponse.json({ success: false, tiers: [] }, { status: 400 });
    }

    const tiers = await getCourseTiers(courseId);
    return NextResponse.json({ success: true, tiers });
  } catch (error) {
    console.error('[course-tiers] Error:', error);
    return NextResponse.json(
      { success: false, tiers: [], message: 'Tier listesi alınamadı' },
      { status: 500 }
    );
  }
}
