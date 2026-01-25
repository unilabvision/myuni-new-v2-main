import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface ReviewerData {
  clerk_id?: string;
  email: string;
  name: string;
  role?: 'admin' | 'reviewer' | 'viewer';
  is_active?: boolean;
  can_vote?: boolean;
  can_change_status?: boolean;
  can_add_notes?: boolean;
}

// Değerlendirici ekle
export async function POST(request: NextRequest) {
  try {
    const body: ReviewerData = await request.json();
    
    const { 
      clerk_id,
      email, 
      name, 
      role = 'reviewer',
      is_active = true,
      can_vote = true,
      can_change_status = false,
      can_add_notes = true
    } = body;

    // Validation
    if (!email || !name) {
      return NextResponse.json(
        { error: 'E-posta ve isim zorunludur' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Geçerli bir e-posta adresi girin' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('internship_reviewers')
      .insert({
        clerk_id: clerk_id || null,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role,
        is_active,
        can_vote,
        can_change_status,
        can_add_notes
      })
      .select()
      .single();

    if (error) {
      // Duplicate email hatası
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Bu e-posta adresi zaten kayıtlı' },
          { status: 409 }
        );
      }
      console.error('Reviewer insert error:', error);
      return NextResponse.json(
        { error: 'Değerlendirici eklenemedi', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Değerlendirici eklendi',
      reviewer: data
    });

  } catch (error) {
    console.error('Reviewer POST error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// Değerlendiricileri getir
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const clerkId = searchParams.get('clerk_id');
    const activeOnly = searchParams.get('active_only') === 'true';

    let query = supabaseAdmin
      .from('internship_reviewers')
      .select('*')
      .order('name', { ascending: true });

    if (email) {
      query = query.eq('email', email.toLowerCase());
    }

    if (clerkId) {
      query = query.eq('clerk_id', clerkId);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Fetch reviewers error:', error);
      return NextResponse.json(
        { error: 'Değerlendiriciler getirilemedi' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reviewers: data,
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Reviewer GET error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// Değerlendirici güncelle
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewerId = searchParams.get('id');

    if (!reviewerId) {
      return NextResponse.json(
        { error: 'Değerlendirici ID gerekli' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from('internship_reviewers')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewerId)
      .select()
      .single();

    if (error) {
      console.error('Update reviewer error:', error);
      return NextResponse.json(
        { error: 'Değerlendirici güncellenemedi' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Değerlendirici güncellendi',
      reviewer: data
    });

  } catch (error) {
    console.error('Reviewer PATCH error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// Değerlendirici sil
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewerId = searchParams.get('id');

    if (!reviewerId) {
      return NextResponse.json(
        { error: 'Değerlendirici ID gerekli' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('internship_reviewers')
      .delete()
      .eq('id', reviewerId);

    if (error) {
      console.error('Delete reviewer error:', error);
      return NextResponse.json(
        { error: 'Değerlendirici silinemedi' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Değerlendirici silindi'
    });

  } catch (error) {
    console.error('Reviewer DELETE error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
