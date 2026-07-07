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

  const { id } = await params;
  const body = await request.json();
  const { slug, name, course_ids } = body;

  const updates: Record<string, unknown> = {};
  if (slug) updates.slug = slug;
  if (name) updates.name = name;

  if (Object.keys(updates).length) {
    const { error } = await supabaseAdmin
      .from('myuni_career_tags')
      .update(updates)
      .eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (Array.isArray(course_ids)) {
    await supabaseAdmin
      .from('myuni_course_career_tags')
      .delete()
      .eq('tag_id', id);
    if (course_ids.length) {
      await supabaseAdmin.from('myuni_course_career_tags').insert(
        course_ids.map((course_id: string) => ({ course_id, tag_id: id }))
      );
    }
  }

  const { data: tag } = await supabaseAdmin
    .from('myuni_career_tags')
    .select('*')
    .eq('id', id)
    .single();

  return NextResponse.json({ success: true, tag });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { error } = await supabaseAdmin
    .from('myuni_career_tags')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
