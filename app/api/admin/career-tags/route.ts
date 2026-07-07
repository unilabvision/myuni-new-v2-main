import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: tags, error } = await supabaseAdmin
    .from('myuni_career_tags')
    .select('*')
    .order('slug');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: courseLinks } = await supabaseAdmin
    .from('myuni_course_career_tags')
    .select('course_id, tag_id');

  const { data: courses } = await supabaseAdmin
    .from('myuni_courses')
    .select('id, title, slug')
    .eq('is_active', true)
    .order('title');

  return NextResponse.json({
    success: true,
    tags: tags || [],
    course_links: courseLinks || [],
    courses: courses || [],
  });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { slug, name, course_ids = [] } = body;

  if (!slug || !name?.tr) {
    return NextResponse.json(
      { error: 'slug ve name.tr zorunlu' },
      { status: 400 }
    );
  }

  const { data: tag, error } = await supabaseAdmin
    .from('myuni_career_tags')
    .insert({ slug, name })
    .select()
    .single();

  if (error || !tag) {
    return NextResponse.json(
      { error: error?.message || 'Etiket oluşturulamadı' },
      { status: 500 }
    );
  }

  if (course_ids.length) {
    await supabaseAdmin.from('myuni_course_career_tags').insert(
      course_ids.map((course_id: string) => ({
        course_id,
        tag_id: tag.id,
      }))
    );
  }

  return NextResponse.json({ success: true, tag });
}
