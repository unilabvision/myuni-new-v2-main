import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import { getAllCareerTags, getAllCoursesForAdmin } from '@/lib/opportunityService';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [oppRes, tags, courses] = await Promise.all([
      supabaseAdmin
        .from('myuni_opportunities')
        .select('*')
        .order('order_index')
        .order('created_at', { ascending: false }),
      getAllCareerTags(),
      getAllCoursesForAdmin(),
    ]);

    if (oppRes.error) {
      return NextResponse.json({ error: oppRes.error.message }, { status: 500 });
    }

    const ids = (oppRes.data || []).map((o) => o.id);
    const [tagLinks, courseLinks] = await Promise.all([
      ids.length
        ? supabaseAdmin
            .from('myuni_opportunity_career_tags')
            .select('*')
            .in('opportunity_id', ids)
        : Promise.resolve({ data: [] }),
      ids.length
        ? supabaseAdmin
            .from('myuni_opportunity_courses')
            .select('*')
            .in('opportunity_id', ids)
        : Promise.resolve({ data: [] }),
    ]);

    const { data: forms } = await supabaseAdmin
      .from('internship_form_configs')
      .select('id, form_name, title, is_active')
      .eq('is_active', true);

    return NextResponse.json({
      success: true,
      opportunities: oppRes.data || [],
      tag_links: tagLinks.data || [],
      course_links: courseLinks.data || [],
      tags,
      courses,
      forms: forms || [],
    });
  } catch (error) {
    console.error('[admin/opportunities] GET:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      slug,
      title,
      description,
      company_name,
      location,
      work_mode,
      application_deadline,
      form_config_id,
      is_active = true,
      is_featured = false,
      order_index = 0,
      tag_ids = [],
      course_ids = [],
    } = body;

    if (!slug || !title?.tr) {
      return NextResponse.json(
        { error: 'slug ve title.tr zorunlu' },
        { status: 400 }
      );
    }

    const { data: opp, error } = await supabaseAdmin
      .from('myuni_opportunities')
      .insert({
        slug,
        title,
        description: description || {},
        company_name,
        location,
        work_mode,
        application_deadline: application_deadline || null,
        form_config_id: form_config_id || null,
        is_active,
        is_featured,
        order_index,
      })
      .select()
      .single();

    if (error || !opp) {
      return NextResponse.json(
        { error: error?.message || 'Kayıt oluşturulamadı' },
        { status: 500 }
      );
    }

    if (tag_ids.length) {
      await supabaseAdmin.from('myuni_opportunity_career_tags').insert(
        tag_ids.map((tag_id: string) => ({
          opportunity_id: opp.id,
          tag_id,
        }))
      );
    }

    if (course_ids.length) {
      await supabaseAdmin.from('myuni_opportunity_courses').insert(
        course_ids.map((course_id: string) => ({
          opportunity_id: opp.id,
          course_id,
          match_type: 'recommended',
        }))
      );
    }

    return NextResponse.json({ success: true, opportunity: opp });
  } catch (error) {
    console.error('[admin/opportunities] POST:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
