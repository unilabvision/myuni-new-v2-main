import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Form config ve alanlarını getir
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const formName = searchParams.get('form_name') || 'myuni_internship';

    // Form config'i getir
    const { data: config, error: configError } = await supabaseAdmin
      .from('internship_form_configs')
      .select('*')
      .eq('form_name', formName)
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      return NextResponse.json(
        { error: 'Form yapılandırması bulunamadı' },
        { status: 404 }
      );
    }

    // Form alanlarını getir
    const { data: fields, error: fieldsError } = await supabaseAdmin
      .from('internship_form_fields')
      .select('*')
      .eq('form_config_id', config.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (fieldsError) {
      console.error('Fetch fields error:', fieldsError);
      return NextResponse.json(
        { error: 'Form alanları getirilemedi' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      config,
      fields: fields || []
    });

  } catch (error) {
    console.error('Form config GET error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// Form config güncelle
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get('id');

    if (!configId) {
      return NextResponse.json(
        { error: 'Config ID gerekli' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from('internship_form_configs')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', configId)
      .select()
      .single();

    if (error) {
      console.error('Update config error:', error);
      return NextResponse.json(
        { error: 'Form yapılandırması güncellenemedi' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Form yapılandırması güncellendi',
      config: data
    });

  } catch (error) {
    console.error('Form config PATCH error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
