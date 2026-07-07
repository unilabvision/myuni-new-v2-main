import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

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
    const { tag_ids, course_ids, ...updates } = body;

    const { data, error } = await supabaseAdmin
      .from('myuni_opportunities')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (Array.isArray(tag_ids)) {
      await supabaseAdmin
        .from('myuni_opportunity_career_tags')
        .delete()
        .eq('opportunity_id', id);
      if (tag_ids.length) {
        await supabaseAdmin.from('myuni_opportunity_career_tags').insert(
          tag_ids.map((tag_id: string) => ({ opportunity_id: id, tag_id }))
        );
      }
    }

    if (Array.isArray(course_ids)) {
      await supabaseAdmin
        .from('myuni_opportunity_courses')
        .delete()
        .eq('opportunity_id', id);
      if (course_ids.length) {
        await supabaseAdmin.from('myuni_opportunity_courses').insert(
          course_ids.map((course_id: string) => ({
            opportunity_id: id,
            course_id,
            match_type: 'recommended',
          }))
        );
      }
    }

    return NextResponse.json({ success: true, opportunity: data });
  } catch (error) {
    console.error('[admin/opportunities/id] PATCH:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from('myuni_opportunities')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[admin/opportunities/id] DELETE:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
