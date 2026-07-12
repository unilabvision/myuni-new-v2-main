import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function createTransporter() {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error('Email configuration missing');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: { rejectUnauthorized: false },
  });
}

function getClientIP(request: NextRequest): string {
  const cloudflareIP = request.headers.get('cf-connecting-ip');
  const realIP = request.headers.get('x-real-ip');
  const forwarded = request.headers.get('x-forwarded-for');
  if (cloudflareIP) return cloudflareIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

function detectDeviceType(userAgent: string): 'Desktop' | 'Mobile' | 'Tablet' | 'Unknown' {
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    return 'Tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
    return 'Mobile';
  }
  if (userAgent && userAgent !== 'unknown') {
    return 'Desktop';
  }
  return 'Unknown';
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const body = await request.json();
    const message = String(body.message || '').trim();
    const locale = body.locale === 'en' ? 'en' : 'tr';

    if (message.length < 3) {
      return NextResponse.json({ error: 'Message too short' }, { status: 400 });
    }

    if (message.length > 5000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 });
    }

    const email =
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress;

    if (!email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    const firstName = user.firstName || email.split('@')[0];
    const lastName = user.lastName || '-';
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const deviceType = detectDeviceType(userAgent);

    const { data, error } = await supabase
      .from('unilab_vision_contact_submissions')
      .insert([
        {
          first_name: firstName,
          last_name: lastName,
          email: email.toLowerCase(),
          phone: null,
          message,
          locale,
          honeypot: null,
          form_timestamp: Date.now(),
          browser_info: null,
          operating_system: null,
          device_type: deviceType,
          ip_address: clientIP,
          user_agent: userAgent,
          status: 'new',
          is_spam: false,
          admin_notes: `clerk_user_id=${userId} | support_widget`,
        },
      ])
      .select('id')
      .single();

    if (error) {
      console.error('Support message DB error:', error.message, error.code, error.details);
      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV === 'development'
              ? `Database error: ${error.message}`
              : 'Database error',
        },
        { status: 500 }
      );
    }

    let emailsSent = false;
    try {
      const transporter = createTransporter();
      const notificationEmails =
        process.env.NOTIFICATION_EMAILS?.split(',').map((e) => e.trim()).filter(Boolean) ||
        ['info@myunilab.net'];

      const subject =
        locale === 'tr'
          ? `Destek mesajı — ${firstName} ${lastName}`.trim()
          : `Support message — ${firstName} ${lastName}`.trim();

      const html = `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
        <h2 style="color:#990000;">${locale === 'tr' ? 'Yeni destek mesajı' : 'New support message'}</h2>
        <p><strong>${locale === 'tr' ? 'Ad Soyad' : 'Name'}:</strong> ${firstName} ${lastName}</p>
        <p><strong>${locale === 'tr' ? 'E-posta' : 'Email'}:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Clerk ID:</strong> ${userId}</p>
        <p><strong>${locale === 'tr' ? 'Mesaj No' : 'Message ID'}:</strong> ${data.id}</p>
        <hr />
        <p style="white-space: pre-wrap;">${message.replace(/</g, '&lt;')}</p>
        <p style="color:#6b7280; font-size: 13px; margin-top: 24px;">
          ${locale === 'tr'
            ? 'Bu maile Yanıtla derseniz cevap doğrudan kullanıcının e-postasına gider.'
            : 'If you Reply to this email, your response goes directly to the user.'}
        </p>
      </div>
    `;

      for (const adminEmail of notificationEmails) {
        await transporter.sendMail({
          from: `"MyUNI Eğitim Platformu" <${process.env.EMAIL_USER}>`,
          to: adminEmail,
          replyTo: email,
          headers: { 'Reply-To': email },
          subject,
          html,
        });
      }

      await transporter.sendMail({
        from: `"MyUNI Eğitim Platformu" <${process.env.EMAIL_USER}>`,
        to: email,
        subject:
          locale === 'tr'
            ? 'Mesajınızı aldık - MyUNI'
            : 'We received your message - MyUNI',
        html: `
        <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
          <p>${locale === 'tr' ? `Merhaba ${firstName},` : `Hi ${firstName},`}</p>
          <p>${
            locale === 'tr'
              ? 'Destek mesajınız bize ulaştı. En kısa sürede e-posta ile dönüş yapacağız.'
              : 'Your support message has been received. We will reply by email as soon as possible.'
          }</p>
          <p style="color:#6b7280; font-size: 13px;">${locale === 'tr' ? 'Mesaj No' : 'Message ID'}: ${data.id}</p>
        </div>
      `,
      });

      emailsSent = true;
    } catch (emailErr) {
      console.error('Support message email error:', emailErr);
      // Mesaj DB'de kayıtlı; SMTP hatası kullanıcıyı tamamen engellemesin
      return NextResponse.json({
        success: true,
        submissionId: data.id,
        emailsSent: false,
        warning:
          locale === 'tr'
            ? 'Mesaj kaydedildi ancak e-posta gönderilemedi. SMTP ayarlarını kontrol edin (EMAIL_USER / EMAIL_PASSWORD — Gmail App Password).'
            : 'Message saved but email could not be sent. Check SMTP settings (EMAIL_USER / EMAIL_PASSWORD — Gmail App Password).',
      });
    }

    return NextResponse.json({ success: true, submissionId: data.id, emailsSent });
  } catch (err) {
    console.error('Support message error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
