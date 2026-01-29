import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { ApplicationStatus } from '@/lib/database.types';
import { sendEmail } from '@/lib/email';

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
      console.error('Database error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // Daha spesifik hata mesajları
      let errorMessage = 'Başvuru kaydedilemedi';
      if (error.code === '23505') {
        errorMessage = 'Bu e-posta adresi ile zaten bir başvuru yapılmış';
      } else if (error.code === '42P01') {
        errorMessage = 'Veritabanı tablosu bulunamadı. Lütfen yönetici ile iletişime geçin.';
      } else if (error.code === '42501') {
        errorMessage = 'Veritabanı izin hatası. Lütfen yönetici ile iletişime geçin.';
      }
      
      return NextResponse.json(
        { 
          error: errorMessage, 
          details: error.message,
          code: error.code,
          hint: error.hint 
        },
        { status: 500 }
      );
    }

    // Email gönderme
    let emailSent = false;
    let emailError: string | undefined;
    const emailErrors: string[] = [];

    const applicantName = `${first_name} ${last_name}`;
    const submissionDate = new Date().toLocaleString('tr-TR', {
      timeZone: 'Europe/Istanbul',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // 1. Başvuru sahibine onay emaili gönder
    try {
      await sendEmail({
        to: email,
        subject: 'Staj Başvurunuz Alındı - MyUNI',
        html: generateApplicantEmail({
          applicantName,
          email,
          school,
          grade,
          submissionId: data.id,
          submissionDate
        }),
        text: `Sayın ${applicantName}, MyUNI staj başvurunuz başarıyla alınmıştır. Başvuru No: ${data.id}`
      });
      console.log('✅ Applicant confirmation email sent to:', email);
      emailSent = true;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Bilinmeyen hata';
      console.error('❌ Applicant email failed:', errMsg);
      emailErrors.push(`Başvuru sahibine email gönderilemedi: ${errMsg}`);
    }

    // 2. Admin'e bildirim emaili gönder
    const notificationEmails = process.env.NOTIFICATION_EMAILS?.split(',') || ['info@myunilab.net'];
    
    for (const adminEmail of notificationEmails) {
      const cleanEmail = adminEmail.trim();
      if (!cleanEmail) continue;

      try {
        await sendEmail({
          to: cleanEmail,
          subject: `Yeni Staj Başvurusu - ${applicantName}`,
          html: generateAdminNotificationEmail({
            applicantName,
            email,
            school,
            grade,
            motivation: motivation || '',
            communication: communication || '',
            team_experience: team_experience || '',
            cv_file_name: cv_file_name || undefined,
            cv_storage_path: cv_storage_path || undefined,
            submissionId: data.id,
            submissionDate
          }),
          text: `Yeni staj başvurusu: ${applicantName} (${email}) - ${school}`
        });
        console.log('✅ Admin notification email sent to:', cleanEmail);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Bilinmeyen hata';
        console.error(`❌ Admin email failed for ${cleanEmail}:`, errMsg);
        emailErrors.push(`Admin'e email gönderilemedi (${cleanEmail}): ${errMsg}`);
      }
    }

    if (emailErrors.length > 0) {
      emailError = emailErrors.join('; ');
    }

    return NextResponse.json({
      success: true,
      message: 'Başvurunuz başarıyla alındı',
      applicationId: data.id,
      emailSent,
      emailError,
      emailErrors: emailErrors.length > 0 ? emailErrors : undefined
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

// ============================================
// EMAIL TEMPLATE FONKSİYONLARI
// ============================================

interface ApplicantEmailData {
  applicantName: string;
  email: string;
  school: string;
  grade: string;
  submissionId: string;
  submissionDate: string;
}

interface AdminEmailData extends ApplicantEmailData {
  motivation: string;
  communication: string;
  team_experience: string;
  cv_file_name?: string;
  cv_storage_path?: string;
}

// Başvuru sahibine gönderilecek onay emaili
function generateApplicantEmail(data: ApplicantEmailData): string {
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Staj Başvurunuz Alındı</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">MyUNI</h1>
              <p style="margin: 8px 0 0; color: #a0a0a0; font-size: 14px;">Stajyer Programı</p>
            </td>
          </tr>
          
          <!-- Success Icon -->
          <tr>
            <td style="padding: 40px 30px 20px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #10b981; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                <span style="color: #ffffff; font-size: 40px;">✓</span>
              </div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <h2 style="margin: 0 0 16px; color: #1a1a2e; font-size: 24px; text-align: center;">Başvurunuz Alındı!</h2>
              <p style="margin: 0 0 24px; color: #6b7280; font-size: 16px; line-height: 1.6; text-align: center;">
                Sayın <strong>${data.applicantName}</strong>,<br>
                MyUNI Stajyer Programı'na gösterdiğiniz ilgi için teşekkür ederiz. Başvurunuz başarıyla alınmış olup değerlendirme sürecine alınmıştır.
              </p>
              
              <!-- Info Card -->
              <table role="presentation" style="width: 100%; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Başvuru No:</span><br>
                          <span style="color: #1a1a2e; font-size: 16px; font-weight: 600;">${data.submissionId.substring(0, 8).toUpperCase()}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Tarih:</span><br>
                          <span style="color: #1a1a2e; font-size: 16px;">${data.submissionDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Okul:</span><br>
                          <span style="color: #1a1a2e; font-size: 16px;">${data.school}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Sınıf:</span><br>
                          <span style="color: #1a1a2e; font-size: 16px;">${data.grade}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Next Steps -->
              <div style="margin-top: 30px; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <h3 style="margin: 0 0 8px; color: #92400e; font-size: 16px;">Sonraki Adımlar</h3>
                <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.5;">
                  Başvurunuz ekibimiz tarafından incelenecektir. Değerlendirme sonucu en kısa sürede e-posta adresinize bildirilecektir.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                Sorularınız için: <a href="mailto:info@myunilab.net" style="color: #3b82f6; text-decoration: none;">info@myunilab.net</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © 2025 MyUNI - Tüm hakları saklıdır.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Admin'e gönderilecek bildirim emaili
function generateAdminNotificationEmail(data: AdminEmailData): string {
  const cvSection = data.cv_file_name ? `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
        <span style="color: #6b7280; font-size: 14px;">CV Dosyası:</span><br>
        <span style="color: #1a1a2e; font-size: 15px;">📎 ${data.cv_file_name}</span>
        ${data.cv_storage_path ? `<br><a href="${data.cv_storage_path}" style="color: #3b82f6; font-size: 13px;">CV'yi Görüntüle</a>` : ''}
      </td>
    </tr>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Yeni Staj Başvurusu</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 700px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #dc2626; padding: 24px 30px;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: #ffffff; color: #dc2626; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 8px;">YENİ BAŞVURU</span>
                    <h1 style="margin: 8px 0 0; color: #ffffff; font-size: 22px; font-weight: 600;">Staj Başvurusu Bildirimi</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Applicant Summary -->
          <tr>
            <td style="padding: 30px;">
              <table role="presentation" style="width: 100%; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 4px; color: #166534; font-size: 20px;">${data.applicantName}</h2>
                    <p style="margin: 0; color: #15803d; font-size: 14px;">${data.email}</p>
                    <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">${data.school} • ${data.grade}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Application Details -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <h3 style="margin: 0 0 16px; color: #1a1a2e; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Başvuru Detayları</h3>
              
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                    <span style="color: #6b7280; font-size: 14px;">Başvuru No:</span><br>
                    <span style="color: #1a1a2e; font-size: 15px; font-weight: 600;">${data.submissionId}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                    <span style="color: #6b7280; font-size: 14px;">Tarih:</span><br>
                    <span style="color: #1a1a2e; font-size: 15px;">${data.submissionDate}</span>
                  </td>
                </tr>
                ${cvSection}
              </table>
            </td>
          </tr>
          
          <!-- Answers Section -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <h3 style="margin: 0 0 16px; color: #1a1a2e; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Başvuru Yanıtları</h3>
              
              ${data.motivation ? `
              <div style="margin-bottom: 20px; padding: 16px; background-color: #f8fafc; border-radius: 8px; border-left: 3px solid #3b82f6;">
                <h4 style="margin: 0 0 8px; color: #1e40af; font-size: 14px;">Motivasyon</h4>
                <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">${data.motivation}</p>
              </div>
              ` : ''}
              
              ${data.communication ? `
              <div style="margin-bottom: 20px; padding: 16px; background-color: #f8fafc; border-radius: 8px; border-left: 3px solid #8b5cf6;">
                <h4 style="margin: 0 0 8px; color: #5b21b6; font-size: 14px;">İletişim</h4>
                <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">${data.communication}</p>
              </div>
              ` : ''}
              
              ${data.team_experience ? `
              <div style="margin-bottom: 20px; padding: 16px; background-color: #f8fafc; border-radius: 8px; border-left: 3px solid #10b981;">
                <h4 style="margin: 0 0 8px; color: #047857; font-size: 14px;">Takım Deneyimi</h4>
                <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">${data.team_experience}</p>
              </div>
              ` : ''}
            </td>
          </tr>
          
          <!-- Action Section -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <table role="presentation" style="width: 100%; background-color: #1a1a2e; border-radius: 8px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <h3 style="margin: 0 0 8px; color: #ffffff; font-size: 16px;">Değerlendirme Bekliyor</h3>
                    <p style="margin: 0; color: #a0a0a0; font-size: 14px;">Bu başvuruyu incelemek için admin paneline giriş yapın.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                MyUNI Stajyer Programı - Otomatik Bildirim Sistemi
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
