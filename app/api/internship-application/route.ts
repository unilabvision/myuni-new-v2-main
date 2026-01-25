import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { ApplicationStatus } from '@/lib/database.types';

interface ApplicationData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  school: string;
  grade: string;
  // Başvuru soruları (ayrı alanlar)
  motivation?: string;
  communication?: string;
  team_experience?: string;
  // CV dosyası
  cv_storage_path?: string;
  cv_file_name?: string;
  cv_file_size?: number;
  cv_mime_type?: string;
  position?: string;
  user_agent?: string;
}

interface UpdateData {
  status?: ApplicationStatus;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_by_email?: string;
  reason?: string; // Status değişiklik sebebi
}

export async function POST(request: NextRequest) {
  try {
    const body: ApplicationData = await request.json();
    
    const { 
      first_name, 
      last_name, 
      email, 
      phone,
      school, 
      grade, 
      motivation,
      communication,
      team_experience,
      cv_storage_path,
      cv_file_name,
      cv_file_size,
      cv_mime_type,
      position,
      user_agent
    } = body;

    // Validation
    if (!first_name || !last_name || !email || !school || !grade) {
      return NextResponse.json(
        { error: 'Zorunlu alanlar eksik: ad, soyad, email, okul, sınıf' },
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

    // CV mime type validation
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (cv_mime_type && !allowedMimeTypes.includes(cv_mime_type)) {
      return NextResponse.json(
        { error: 'CV dosyası sadece PDF, DOC veya DOCX formatında olmalıdır' },
        { status: 400 }
      );
    }

    // Insert into database
    const { data, error } = await supabaseAdmin
      .from('internship_applications')
      .insert({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        school: school.trim(),
        grade,
        motivation: motivation?.trim() || null,
        communication: communication?.trim() || null,
        team_experience: team_experience?.trim() || null,
        cv_storage_path: cv_storage_path || null,
        cv_file_name: cv_file_name || null,
        cv_file_size: cv_file_size || null,
        cv_mime_type: cv_mime_type || null,
        position: position || null,
        user_agent: user_agent || null,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Başvuru kaydedilemedi', details: error.message },
        { status: 500 }
      );
    }

    // TODO: Send confirmation email to applicant
    // TODO: Send notification email to admin

    return NextResponse.json({
      success: true,
      message: 'Başvurunuz başarıyla alındı',
      applicationId: data.id
    });

  } catch (error) {
    console.error('Internship application error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const withVotes = searchParams.get('with_votes') === 'true';

    // Tek başvuru getir
    if (applicationId) {
      const { data: application, error } = await supabaseAdmin
        .from('internship_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (error || !application) {
        return NextResponse.json(
          { error: 'Başvuru bulunamadı' },
          { status: 404 }
        );
      }

      // Oyları da getir
      let votes = null;
      if (withVotes) {
        const { data: votesData } = await supabaseAdmin
          .from('internship_votes')
          .select('*')
          .eq('application_id', applicationId);
        votes = votesData;
      }

      // Status history getir
      const { data: history } = await supabaseAdmin
        .from('internship_status_history')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false });

      return NextResponse.json({
        success: true,
        application,
        votes,
        history
      });
    }

    // Liste getir
    let query = supabaseAdmin
      .from('internship_applications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Fetch error:', error);
      return NextResponse.json(
        { error: 'Başvurular getirilemedi' },
        { status: 500 }
      );
    }

    // İstatistikler
    const stats = {
      total: data?.length || 0,
      pending: data?.filter(a => a.status === 'pending').length || 0,
      under_review: data?.filter(a => a.status === 'under_review').length || 0,
      interview: data?.filter(a => a.status === 'interview').length || 0,
      accepted: data?.filter(a => a.status === 'accepted').length || 0,
      rejected: data?.filter(a => a.status === 'rejected').length || 0,
    };

    return NextResponse.json({
      success: true,
      applications: data,
      count: data?.length || 0,
      stats
    });

  } catch (error) {
    console.error('GET applications error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// Başvuru güncelle (status, notlar)
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('id');

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Başvuru ID gerekli' },
        { status: 400 }
      );
    }

    const body: UpdateData = await request.json();
    const { status, admin_notes, reviewed_by, reviewed_by_email, reason } = body;

    // Mevcut başvuruyu al
    const { data: currentApp, error: fetchError } = await supabaseAdmin
      .from('internship_applications')
      .select('status')
      .eq('id', applicationId)
      .single();

    if (fetchError || !currentApp) {
      return NextResponse.json(
        { error: 'Başvuru bulunamadı' },
        { status: 404 }
      );
    }

    // Güncelleme objesi
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
      updateData.reviewed_at = new Date().toISOString();
      if (reviewed_by) {
        updateData.reviewed_by = reviewed_by;
      }
    }

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes;
    }

    // Güncelle
    const { data, error } = await supabaseAdmin
      .from('internship_applications')
      .update(updateData)
      .eq('id', applicationId)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json(
        { error: 'Başvuru güncellenemedi' },
        { status: 500 }
      );
    }

    // Status değiştiyse history'ye kaydet
    if (status && status !== currentApp.status) {
      await supabaseAdmin
        .from('internship_status_history')
        .insert({
          application_id: applicationId,
          old_status: currentApp.status,
          new_status: status,
          changed_by: reviewed_by || 'system',
          changed_by_email: reviewed_by_email || null,
          reason: reason || null
        });
    }

    return NextResponse.json({
      success: true,
      message: 'Başvuru güncellendi',
      application: data
    });

  } catch (error) {
    console.error('PATCH application error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// Başvuru sil
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('id');

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Başvuru ID gerekli' },
        { status: 400 }
      );
    }

    // Önce ilişkili oyları sil (CASCADE ile otomatik silinir ama yine de)
    await supabaseAdmin
      .from('internship_votes')
      .delete()
      .eq('application_id', applicationId);

    // Status history sil
    await supabaseAdmin
      .from('internship_status_history')
      .delete()
      .eq('application_id', applicationId);

    // Başvuruyu sil
    const { error } = await supabaseAdmin
      .from('internship_applications')
      .delete()
      .eq('id', applicationId);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json(
        { error: 'Başvuru silinemedi' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Başvuru silindi'
    });

  } catch (error) {
    console.error('DELETE application error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
