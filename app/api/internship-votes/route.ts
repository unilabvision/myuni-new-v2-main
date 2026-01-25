import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface VoteData {
  application_id: string;
  voter_id: string;
  voter_email: string;
  voter_name: string;
  vote_type: 'approve' | 'reject' | 'neutral' | 'shortlist';
  score?: number;
  comment?: string;
}

// Oy ekle veya güncelle
export async function POST(request: NextRequest) {
  try {
    const body: VoteData = await request.json();
    
    const { 
      application_id, 
      voter_id, 
      voter_email, 
      voter_name, 
      vote_type, 
      score, 
      comment 
    } = body;

    // Validation
    if (!application_id || !voter_id || !voter_email || !voter_name || !vote_type) {
      return NextResponse.json(
        { error: 'Zorunlu alanlar eksik' },
        { status: 400 }
      );
    }

    // Score validation (0-10)
    if (score !== undefined && (score < 0 || score > 10)) {
      return NextResponse.json(
        { error: 'Puan 0-10 arasında olmalıdır' },
        { status: 400 }
      );
    }

    // Upsert - aynı kişi tekrar oy verirse güncelle
    const { data, error } = await supabaseAdmin
      .from('internship_votes')
      .upsert(
        {
          application_id,
          voter_id,
          voter_email,
          voter_name,
          vote_type,
          score: score ?? null,
          comment: comment?.trim() || null,
        },
        {
          onConflict: 'application_id,voter_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Vote error:', error);
      return NextResponse.json(
        { error: 'Oy kaydedilemedi', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Oy başarıyla kaydedildi',
      vote: data
    });

  } catch (error) {
    console.error('Vote POST error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// Oyları getir
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('application_id');
    const voterId = searchParams.get('voter_id');

    let query = supabaseAdmin
      .from('internship_votes')
      .select('*')
      .order('created_at', { ascending: false });

    if (applicationId) {
      query = query.eq('application_id', applicationId);
    }

    if (voterId) {
      query = query.eq('voter_id', voterId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Fetch votes error:', error);
      return NextResponse.json(
        { error: 'Oylar getirilemedi' },
        { status: 500 }
      );
    }

    // İstatistikleri hesapla
    const stats = {
      total: data?.length || 0,
      approve: data?.filter(v => v.vote_type === 'approve').length || 0,
      reject: data?.filter(v => v.vote_type === 'reject').length || 0,
      neutral: data?.filter(v => v.vote_type === 'neutral').length || 0,
      shortlist: data?.filter(v => v.vote_type === 'shortlist').length || 0,
      averageScore: data?.filter(v => v.score !== null).length 
        ? data.filter(v => v.score !== null).reduce((sum, v) => sum + (v.score || 0), 0) / data.filter(v => v.score !== null).length
        : null
    };

    return NextResponse.json({
      success: true,
      votes: data,
      stats
    });

  } catch (error) {
    console.error('Vote GET error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// Oy sil
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const voteId = searchParams.get('id');

    if (!voteId) {
      return NextResponse.json(
        { error: 'Oy ID gerekli' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('internship_votes')
      .delete()
      .eq('id', voteId);

    if (error) {
      console.error('Delete vote error:', error);
      return NextResponse.json(
        { error: 'Oy silinemedi' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Oy silindi'
    });

  } catch (error) {
    console.error('Vote DELETE error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
