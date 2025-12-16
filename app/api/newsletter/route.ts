import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Environment variables check

const supabase = createClient(supabaseUrl, supabaseKey);

// Create nodemailer transporter
const createTransporter = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error('Email configuration missing. Please check EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD environment variables.');
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
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3'
    }
  });
};

interface NewsletterSubmission {
  firstName: string;
  lastName: string;
  email: string;
  locale: string;
  browser: string;
  operatingSystem: string;
  deviceType: string;
  honeypot: string;
  timestamp: number;
  hCaptchaToken: string;
  type: string;
}

// Rate limiting basit implementation (production'da Redis kullanın)
const submissions = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 5; // 5 submission per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in ms

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userSubmissions = submissions.get(ip);

  if (!userSubmissions) {
    submissions.set(ip, { count: 1, lastReset: now });
    return true;
  }

  // Reset counter if window expired
  if (now - userSubmissions.lastReset > RATE_WINDOW) {
    submissions.set(ip, { count: 1, lastReset: now });
    return true;
  }

  // Check if under limit
  if (userSubmissions.count < RATE_LIMIT) {
    userSubmissions.count++;
    return true;
  }

  return false;
}

async function verifyHCaptcha(token: string, ip?: string): Promise<boolean> {
  try {
    const hcaptchaSecret = process.env.HCAPTCHA_SECRET_KEY;
    
    if (!hcaptchaSecret) {
      console.error('hCaptcha secret key not found');
      return false;
    }

    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: hcaptchaSecret,
        response: token,
        remoteip: ip || '',
      }),
    });

    const data = await response.json();
    
    return data.success === true;
  } catch (error) {
    console.error('hCaptcha verification error:', error);
    return false;
  }
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isSpamSubmission(data: NewsletterSubmission): boolean {
  // Honeypot check
  if (data.honeypot && data.honeypot.trim() !== '') {
    return true;
  }

  // Timing check (form filled too quickly)
  const submissionTime = Date.now();
  const formFillTime = submissionTime - data.timestamp;
  if (formFillTime < 3000) { // Less than 3 seconds
    return true;
  }

  // Simple content checks
  const fullName = `${data.firstName} ${data.lastName}`.toLowerCase();
  const spamKeywords = ['test', 'spam', 'bot', 'admin', 'null', 'undefined'];
  
  for (const keyword of spamKeywords) {
    if (fullName.includes(keyword)) {
      return true;
    }
  }

  return false;
}

// Generate admin notification email for new newsletter subscription
const generateNotificationEmail = (
  firstName: string,
  lastName: string,
  email: string,
  submissionId: string,
  locale: string,
  isReactivation: boolean = false
) => {
  const content = {
    tr: {
      title: isReactivation ? 'Newsletter Aboneliği Reaktive Edildi' : 'Yeni Newsletter Aboneliği',
      newBadge: isReactivation ? 'Reaktive' : 'Yeni',
      subtitle: 'UNILAB Vision Newsletter',
      alertText: isReactivation ? 
        'Bir kullanıcı newsletter aboneliğini reaktive etti.' : 
        'Yeni bir newsletter aboneliği alınmıştır.',
      infoTitle: 'Abone Bilgileri',
      actionTitle: 'İnceleme',
      actionText: 'Yeni abonelik bilgilerini yönetici panelinden görüntüleyebilirsiniz.',
      footerText: 'UNILAB Vision - Otomatik Newsletter Bildirim Sistemi',
      subscriptionNo: 'Abonelik No:',
      date: 'Tarih:',
      name: 'Ad Soyad:',
      emailLabel: 'E-posta:',
      localeLabel: 'Dil:',
      statusLabel: 'Durum:',
      statusActive: 'Aktif'
    },
    en: {
      title: isReactivation ? 'Newsletter Subscription Reactivated' : 'New Newsletter Subscription',
      newBadge: isReactivation ? 'Reactivated' : 'New',
      subtitle: 'UNILAB Vision Newsletter',
      alertText: isReactivation ? 
        'A user has reactivated their newsletter subscription.' : 
        'A new newsletter subscription has been received.',
      infoTitle: 'Subscriber Information',
      actionTitle: 'Review',
      actionText: 'You can view the new subscription details from the admin panel.',
      footerText: 'UNILAB Vision - Automatic Newsletter Notification System',
      subscriptionNo: 'Subscription No:',
      date: 'Date:',
      name: 'Name:',
      emailLabel: 'Email:',
      localeLabel: 'Language:',
      statusLabel: 'Status:',
      statusActive: 'Active'
    }
  };

  const t = locale in content ? content[locale as keyof typeof content] : content.tr;
  const currentDate = new Date().toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US');

  return `
    <!DOCTYPE html>
    <html lang="${locale}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t.title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6; color: #171717; background-color: #f8f9fa; padding: 20px;
        }
        .container {
          max-width: 600px; margin: 0 auto; background-color: #ffffff;
          border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;
        }
        .header {
          padding: 32px 30px; background-color: #fef2f2; border-bottom: 1px solid #fecaca;
        }
        .alert-badge {
          display: inline-block; background-color: #a90013; color: white;
          padding: 4px 12px; border-radius: 12px; font-size: 12px;
          font-weight: 500; margin-bottom: 12px;
        }
        .header h1 {
          font-size: 18px; font-weight: 500; color: #171717; margin-bottom: 8px;
        }
        .header-subtitle { font-size: 14px; color: #6b7280; }
        .content { padding: 32px 30px; }
        .alert-message {
          background-color: #fff7ed; border: 1px solid #fed7aa;
          border-left: 3px solid #a90013; padding: 16px; margin-bottom: 24px; border-radius: 4px;
        }
        .alert-text { font-size: 14px; color: #9a3412; font-weight: 500; }
        .section {
          background-color: #f9fafb; border: 1px solid #e5e7eb;
          border-radius: 6px; padding: 24px; margin-bottom: 20px;
        }
        .section-title {
          font-size: 16px; font-weight: 500; color: #171717; margin-bottom: 16px;
          padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;
        }
        .info-row {
          display: flex; margin-bottom: 8px; font-size: 14px; align-items: baseline;
        }
        .info-row:last-child { margin-bottom: 0; }
        .info-label {
          font-weight: 500; color: #6b7280; width: 120px; flex-shrink: 0;
        }
        .info-value { color: #171717; word-break: break-word; }
        .action-section {
          background-color: #171717; color: #ffffff; padding: 24px;
          text-align: center; margin-top: 20px;
        }
        .action-section h3 {
          font-size: 16px; font-weight: 500; margin-bottom: 8px;
        }
        .action-section p { font-size: 14px; opacity: 0.8; }
        .footer {
          padding: 20px 30px; background-color: #f9fafb;
          border-top: 1px solid #e5e7eb; text-align: center;
        }
        .footer p { font-size: 12px; color: #9ca3af; }
        @media (max-width: 600px) {
          body { padding: 10px; }
          .header, .content { padding: 20px; }
          .section { padding: 20px; }
          .info-row { flex-direction: column; margin-bottom: 12px; }
          .info-label { width: auto; margin-bottom: 4px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="alert-badge">${t.newBadge}</div>
          <h1>📧 ${t.title}</h1>
          <div class="header-subtitle">${t.subtitle}</div>
        </div>
        
        <div class="content">
          <div class="alert-message">
            <div class="alert-text">${t.alertText}</div>
          </div>
          
          <div class="section">
            <div class="section-title">${t.infoTitle}</div>
            <div class="info-row">
              <div class="info-label">${t.subscriptionNo}</div>
              <div class="info-value">${submissionId}</div>
            </div>
            <div class="info-row">
              <div class="info-label">${t.date}</div>
              <div class="info-value">${currentDate}</div>
            </div>
            <div class="info-row">
              <div class="info-label">${t.name}</div>
              <div class="info-value">${firstName} ${lastName}</div>
            </div>
            <div class="info-row">
              <div class="info-label">${t.emailLabel}</div>
              <div class="info-value">${email}</div>
            </div>
            <div class="info-row">
              <div class="info-label">${t.localeLabel}</div>
              <div class="info-value">${locale === 'tr' ? 'Türkçe' : 'English'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">${t.statusLabel}</div>
              <div class="info-value">${t.statusActive}</div>
            </div>
          </div>
          
          <div class="action-section">
            <h3>${t.actionTitle}</h3>
            <p>${t.actionText}</p>
          </div>
        </div>
        
        <div class="footer">
          <p>${t.footerText}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
const generateWelcomeEmail = (firstName: string, lastName: string, submissionId: string, locale: string) => {
  const content = {
    tr: {
      title: 'Newsletter\'a Hoşgeldiniz!',
      greeting: `Sayın ${firstName} ${lastName},`,
      message: 'UNILAB Vision newsletter\'ına abone olduğunuz için teşekkür ederiz. Bundan sonra en güncel haberlerimizi ve duyurularımızı e-posta adresinize göndereceğiz.',
      benefitsTitle: 'Newsletter Avantajları',
      benefits: [
        'En son ürün güncellemeleri',
        'Özel etkinlik duyuruları',
        'Sektör trendleri ve analızleri',
        'Erken erişim fırsatları'
      ],
      infoTitle: 'Abonelik Bilgileri',
      subscriptionNo: 'Abonelik No:',
      date: 'Kayıt Tarihi:',
      email: 'E-posta:',
      frequency: 'Gönderim Sıklığı: Haftalık',
      unsubscribeInfo: 'Dilediğiniz zaman newsletter aboneliğinizi iptal edebilirsiniz.',
      contactTitle: 'İletişim',
      contactInfo: 'info@myunilab.net',
      footerText: 'Bu e-posta otomatik olarak gönderilmiştir.',
      companyName: '© 2025 UNILAB Vision'
    },
    en: {
      title: 'Welcome to Our Newsletter!',
      greeting: `Dear ${firstName} ${lastName},`,
      message: 'Thank you for subscribing to the UNILAB Vision newsletter. From now on, we will send the latest news and announcements to your email address.',
      benefitsTitle: 'Newsletter Benefits',
      benefits: [
        'Latest product updates',
        'Special event announcements',
        'Industry trends and analyses',
        'Early access opportunities'
      ],
      infoTitle: 'Subscription Information',
      subscriptionNo: 'Subscription No:',
      date: 'Registration Date:',
      email: 'Email:',
      frequency: 'Frequency: Weekly',
      unsubscribeInfo: 'You can unsubscribe from the newsletter at any time.',
      contactTitle: 'Contact',
      contactInfo: 'info@myunilab.net',
      footerText: 'This email was sent automatically.',
      companyName: '© 2025 UNILAB Vision'
    }
  };

  const t = locale in content ? content[locale as keyof typeof content] : content.tr;
  const currentDate = new Date().toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US');

  return `
    <!DOCTYPE html>
    <html lang="${locale}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t.title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6; color: #171717; background-color: #f8f9fa; padding: 20px;
        }
        .container {
          max-width: 600px; margin: 0 auto; background-color: #ffffff;
          border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;
        }
        .header {
          padding: 40px 30px; background: linear-gradient(135deg, #a90013 0%, #8a0010 100%);
          color: white; text-align: center;
        }
        .header h1 { font-size: 24px; font-weight: 500; margin-bottom: 8px; }
        .header p { font-size: 16px; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 16px; margin-bottom: 24px; color: #171717; font-weight: 500; }
        .message { font-size: 16px; line-height: 1.6; margin-bottom: 32px; color: #4b5563; }
        .benefits-card {
          background-color: #f9fafb; border: 1px solid #e5e7eb;
          border-radius: 6px; padding: 24px; margin: 24px 0;
        }
        .benefits-card h3 {
          font-size: 16px; font-weight: 500; color: #171717; margin-bottom: 16px;
        }
        .benefits-list {
          list-style: none; padding: 0;
        }
        .benefits-list li {
          padding: 8px 0; color: #4b5563; font-size: 14px;
          position: relative; padding-left: 20px;
        }
        .benefits-list li:before {
          content: '✓'; position: absolute; left: 0; top: 8px;
          color: #a90013; font-weight: bold;
        }
        .info-card {
          background-color: #fef3f2; border: 1px solid #fecaca;
          border-radius: 6px; padding: 24px; margin: 24px 0;
        }
        .info-card h3 {
          font-size: 16px; font-weight: 500; color: #171717; margin-bottom: 16px;
        }
        .info-row {
          display: flex; margin-bottom: 8px; font-size: 14px; align-items: baseline;
        }
        .info-row:last-child { margin-bottom: 0; }
        .info-label {
          font-weight: 500; color: #6b7280; width: 120px; flex-shrink: 0;
        }
        .info-value { color: #171717; }
        .footer {
          padding: 24px 30px; background-color: #f9fafb;
          border-top: 1px solid #e5e7eb; text-align: center;
        }
        .footer p {
          font-size: 12px; color: #9ca3af; margin-bottom: 4px;
        }
        .footer p:last-child { margin-bottom: 0; }
        @media (max-width: 600px) {
          body { padding: 10px; }
          .header, .content { padding: 24px 20px; }
          .info-card, .benefits-card { padding: 20px; }
          .info-row { flex-direction: column; margin-bottom: 12px; }
          .info-label { width: auto; margin-bottom: 2px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📧 ${t.title}</h1>
          <p>UNILAB Vision Newsletter</p>
        </div>
        
        <div class="content">
          <div class="greeting">${t.greeting}</div>
          <div class="message">${t.message}</div>
          
          <div class="benefits-card">
            <h3>${t.benefitsTitle}</h3>
            <ul class="benefits-list">
              ${t.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
            </ul>
          </div>
          
          <div class="info-card">
            <h3>${t.infoTitle}</h3>
            <div class="info-row">
              <div class="info-label">${t.subscriptionNo}</div>
              <div class="info-value">${submissionId}</div>
            </div>
            <div class="info-row">
              <div class="info-label">${t.date}</div>
              <div class="info-value">${currentDate}</div>
            </div>
            <div class="info-row">
              <div class="info-label">${t.frequency}</div>
              <div class="info-value"></div>
            </div>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">${t.unsubscribeInfo}</p>
          
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <h3 style="font-size: 16px; color: #171717; margin-bottom: 8px;">${t.contactTitle}</h3>
            <p style="font-size: 14px; color: #6b7280;">${t.contactInfo}</p>
          </div>
        </div>
        
        <div class="footer">
          <p>${t.footerText}</p>
          <p>${t.companyName}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send email function
const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"UNILAB Vision Newsletter" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
    };

    await transporter.sendMail(mailOptions); // Removed unused 'result' variable
    
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Newsletter email sending failed:', {
      to: to,
      message: errorMessage
    });
    return false;
  }
};

export async function POST(request: NextRequest) {
  try {
    
    // Get client IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               request.headers.get('cf-connecting-ip') ||
               request.headers.get('x-client-ip') ||
               'unknown';


    // Rate limiting check
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body: NewsletterSubmission = await request.json();

    // Validate required fields
    if (!body.firstName?.trim() || !body.lastName?.trim() || !body.email?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate hCaptcha
    if (!body.hCaptchaToken) {
      return NextResponse.json(
        { error: 'Captcha verification required' },
        { status: 400 }
      );
    }

    const captchaValid = await verifyHCaptcha(body.hCaptchaToken, ip);
    if (!captchaValid) {
      return NextResponse.json(
        { error: 'Captcha verification failed' },
        { status: 400 }
      );
    }

    // Spam detection
    const isSpam = isSpamSubmission(body);
    if (isSpam) {
      return NextResponse.json(
        { error: 'Submission flagged as spam' },
        { status: 400 }
      );
    }

    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // Prepare data for database
    const subscriptionData = {
      first_name: body.firstName.trim(),
      last_name: body.lastName.trim(),
      email: body.email.toLowerCase().trim(),
      locale: body.locale || 'tr',
      user_agent: userAgent,
    };

    // Check if email already exists
    const { data: existingSubscriber, error: checkError } = await supabase
      .from('unilab_vision_newsletter_subscriptions')
      .select('id, subscription_status')
      .eq('email', subscriptionData.email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Database check error:', checkError);
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      );
    }

    let submissionId;

    if (existingSubscriber) {
      // Email already exists
      if (existingSubscriber.subscription_status === 'active') {
        return NextResponse.json(
          { error: 'Email already subscribed to newsletter' },
          { status: 400 }
        );
      } else {
        // Reactivate subscription
        const { data: updateData, error: updateError } = await supabase
          .from('unilab_vision_newsletter_subscriptions')
          .update({
            subscription_status: 'active',
            first_name: subscriptionData.first_name,
            last_name: subscriptionData.last_name,
            locale: subscriptionData.locale,
            user_agent: subscriptionData.user_agent,
            updated_at: new Date().toISOString(),
          })
          .eq('email', subscriptionData.email)
          .select('id')
          .single();

        if (updateError) {
          console.error('Database update error:', updateError);
          return NextResponse.json(
            { error: 'Failed to update subscription' },
            { status: 500 }
          );
        }

        submissionId = updateData?.id;
      }
    } else {
      // Insert new subscription
      const { data: insertData, error: insertError } = await supabase
        .from('unilab_vision_newsletter_subscriptions')
        .insert(subscriptionData)
        .select('id')
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
        if (insertError.code === '23505') {
          return NextResponse.json(
            { error: 'Email already subscribed to newsletter' },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: 'Failed to save subscription' },
          { status: 500 }
        );
      }

      submissionId = insertData?.id;
    }

    // Email gönderimi için değişkenler
    let welcomeEmailSent = false;
    let adminNotificationsSent = 0;
    let totalAdminNotifications = 0;
    const emailErrors: string[] = [];
    const isReactivation = !!existingSubscriber;

    // Send welcome email to user
    try {
      welcomeEmailSent = await sendEmail(
        subscriptionData.email,
        subscriptionData.locale === 'tr' ? 
          'Newsletter\'a Hoşgeldiniz - UNILAB Vision' : 
          'Welcome to Our Newsletter - UNILAB Vision',
        generateWelcomeEmail(subscriptionData.first_name, subscriptionData.last_name, submissionId, subscriptionData.locale)
      );
      if (welcomeEmailSent) {
      }
    } catch (emailError) {
      const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error occurred';
      console.error('Welcome email sending failed:', emailError);
      emailErrors.push(`Welcome email failed: ${errorMessage}`);
    }

    // Send notification emails to admin(s)
    const notificationEmails = process.env.NOTIFICATION_EMAILS?.split(',') || ['info@myunilab.net'];
    totalAdminNotifications = notificationEmails.length;
    

    for (const adminEmail of notificationEmails) {
      const cleanEmail = adminEmail.trim();
      if (!cleanEmail) continue;
      
      try {
        const notificationSent = await sendEmail(
          cleanEmail,
          subscriptionData.locale === 'tr' ? 
            (isReactivation ? 'Newsletter Aboneliği Reaktive Edildi - UNILAB Vision' : 'Yeni Newsletter Aboneliği - UNILAB Vision') :
            (isReactivation ? 'Newsletter Subscription Reactivated - UNILAB Vision' : 'New Newsletter Subscription - UNILAB Vision'),
          generateNotificationEmail(
            subscriptionData.first_name, 
            subscriptionData.last_name, 
            subscriptionData.email, 
            submissionId, 
            subscriptionData.locale,
            isReactivation
          )
        );
        
        if (notificationSent) {
          adminNotificationsSent++;
        }
      } catch (notificationError) {
        const errorMessage = notificationError instanceof Error ? notificationError.message : 'Unknown error occurred';
        const errorMsg = `Admin notification failed for ${cleanEmail}: ${errorMessage}`;
        console.error(`❌ Notification email failed for ${cleanEmail}:`, notificationError);
        emailErrors.push(errorMsg);
      }
    }



    return NextResponse.json({
      success: true,
      message: 'Newsletter subscription successful',
      submissionId: submissionId,
      emailsSent: {
        welcomeEmail: welcomeEmailSent,
        adminNotifications: adminNotificationsSent,
        totalAdminNotifications: totalAdminNotifications,
        isReactivation: isReactivation,
        errors: emailErrors.length > 0 ? emailErrors : undefined
      }
    });

  } catch (error) {
    console.error('Newsletter API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}