import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * GET /api/enrollments/counts?courseIds=id1,id2
 * Public aggregate counts only — no row data.
 * Optional: ?sinceDays=30 for recent enrollments (FeaturedFilter / CourseList)
 */
export async function GET(request: NextRequest) {
  try {
    const courseIdsParam = request.nextUrl.searchParams.get('courseIds') || '';
    const sinceDays = parseInt(request.nextUrl.searchParams.get('sinceDays') || '0', 10);

    const courseIds = courseIdsParam
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (courseIds.length === 0) {
      return NextResponse.json({ success: false, error: 'courseIds is required' }, { status: 400 });
    }

    // Cap to avoid abuse
    const limitedIds = courseIds.slice(0, 200);

    let query = supabaseAdmin
      .from('myuni_enrollments')
      .select('course_id')
      .in('course_id', limitedIds)
      .eq('is_active', true);

    if (sinceDays > 0) {
      const since = new Date();
      since.setDate(since.getDate() - sinceDays);
      query = query.gte('enrolled_at', since.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Enrollment counts error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const counts: Record<string, number> = {};
    for (const id of limitedIds) counts[id] = 0;
    for (const row of data || []) {
      const cid = row.course_id as string;
      if (cid in counts) counts[cid] += 1;
      else counts[cid] = 1;
    }

    return NextResponse.json({ success: true, counts });
  } catch (error) {
    console.error('GET /api/enrollments/counts error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
