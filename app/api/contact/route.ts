// app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Supabase client (service role for backend operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Create nodemailer transporter with improved configuration
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
    },
    pool: true,
    maxConnections: 1,
    rateDelta: 20000,
    rateLimit: 5,
    debug: false, // Production'da false olmalı
    logger: false // Production'da false olmalı
  });
};

// Type definitions
interface SpamCheckData {
  honeypot?: string;
  timestamp?: number;
  message?: string;
  email?: string;
}

interface SpamCheckResult {
  isSpam: boolean;
  reason?: string;
}

interface CaptchaResult {
  success: boolean;
  error?: string;
}

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message: string;
  locale?: string;
  browser?: string;
  operatingSystem?: string;
  deviceType?: string;
  honeypot?: string;
  timestamp?: number;
  hCaptchaToken: string;
}

interface ClientInfo {
  ip: string;
  browser: string;
  os: string;
  device: string;
}

// Generate confirmation email HTML for user
const generateConfirmationEmail = (firstName: string, lastName: string, submissionId: string, locale: string) => {
  const content = {
    tr: {
      title: 'Mesajınızı Aldık',
      greeting: `Sayın ${firstName} ${lastName},`,
      message: 'İletişim talebiniz için teşekkür ederiz. Mesajınız tarafımıza ulaşmış olup, en kısa sürede size geri dönüş yapacağız.',
      infoTitle: 'İletişim Detayları',
      submissionNo: 'Mesaj No:',
      date: 'Tarih:',
      email: 'E-posta:',
      note: 'Mesajınız ekibimiz tarafından incelenecek ve sonuç en kısa sürede size bildirilecektir. Sorularınız için aşağıdaki iletişim bilgilerini kullanabilirsiniz.',
      contactTitle: 'İletişim',
      contactInfo: `info@myunilab.net<br>Mesaj No: ${submissionId}`,
      footerText: 'Bu e-posta otomatik olarak gönderilmiştir.',
      companyName: '© 2025 MyUNI Eğitim Platformu'
    },
    en: {
      title: 'We Received Your Message',
      greeting: `Dear ${firstName} ${lastName},`,
      message: 'Thank you for contacting us. Your message has been received and we will get back to you as soon as possible.',
      infoTitle: 'Contact Details',
      submissionNo: 'Message No:',
      date: 'Date:',
      email: 'Email:',
      note: 'Your message will be reviewed by our team and we will contact you as soon as possible. You can use the contact information below for your questions.',
      contactTitle: 'Contact',
      contactInfo: `info@myunilab.net<br>Message No: ${submissionId}`,
      footerText: 'This email was sent automatically.',
      companyName: '© 2025 MyUNI Eğitim Platformu'
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
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #171717;
          background-color: #f8f9fa;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }
        .header {
          padding: 40px 30px;
          border-bottom: 1px solid #e5e7eb;
        }
        .brand {
          font-size: 20px;
          font-weight: 500;
          color: #171717;
          margin-bottom: 4px;
        }
        .accent-line {
          width: 64px;
          height: 1px;
          background-color: #a90013;
          margin-bottom: 16px;
        }
        .header-subtitle {
          font-size: 14px;
          color: #6b7280;
          font-weight: normal;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 24px;
          color: #171717;
          font-weight: 500;
        }
        .message {
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 32px;
          color: #4b5563;
        }
        .info-card {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 24px;
          margin: 24px 0;
        }
        .info-card h3 {
          font-size: 16px;
          font-weight: 500;
          color: #171717;
          margin-bottom: 16px;
        }
        .info-row {
          display: flex;
          margin-bottom: 8px;
          font-size: 14px;
          align-items: baseline;
        }
        .info-row:last-child {
          margin-bottom: 0;
        }
        .info-label {
          font-weight: 500;
          color: #6b7280;
          width: 100px;
          flex-shrink: 0;
        }
        .info-value {
          color: #171717;
        }
        .note-section {
          background-color: #fef3f2;
          border-left: 3px solid #a90013;
          padding: 20px;
          margin: 24px 0;
        }
        .note-section p {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
          margin: 0;
        }
        .contact-section {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }
        .contact-section h3 {
          font-size: 16px;
          font-weight: 500;
          color: #171717;
          margin-bottom: 12px;
        }
        .contact-info {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.5;
        }
        .footer {
          padding: 24px 30px;
          background-color: #f9fafb;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }
        .footer p {
          font-size: 12px;
          color: #9ca3af;
          margin-bottom: 4px;
        }
        .footer p:last-child {
          margin-bottom: 0;
        }
        @media (max-width: 600px) {
          body {
            padding: 10px;
          }
          .header, .content {
            padding: 24px 20px;
          }
          .info-card {
            padding: 20px;
          }
          .info-row {
            flex-direction: column;
            margin-bottom: 12px;
          }
          .info-label {
            width: auto;
            margin-bottom: 2px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">MyUNI Eğitim Platformu</div>
          <div class="accent-line"></div>
          <div class="header-subtitle">${t.title}</div>
        </div>
        
        <div class="content">
          <div class="greeting">
            ${t.greeting}
          </div>
          
          <div class="message">
            ${t.message}
          </div>
          
          <div class="info-card">
            <h3>${t.infoTitle}</h3>
            <div class="info-row">
              <div class="info-label">${t.submissionNo}</div>
              <div class="info-value">${submissionId}</div>
            </div>
            <div class="info-row">
              <div class="info-label">${t.date}</div>
              <div class="info-value">${currentDate}</div>
            </div>
          </div>
          
          <div class="note-section">
            <p>${t.note}</p>
          </div>
          
          <div class="contact-section">
            <h3>${t.contactTitle}</h3>
            <div class="contact-info">
              ${t.contactInfo}
            </div>
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

// Generate notification email HTML for admin
const generateNotificationEmail = (
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  message: string,
  submissionId: string,
  clientInfo: ClientInfo,
  locale: string
) => {
  const content = {
    tr: {
      title: 'Yeni İletişim Mesajı',
      newBadge: 'Yeni',
      subtitle: 'MyUNI Eğitim Platformu',
      alertText: 'Yeni bir iletişim mesajı alınmıştır.',
      infoTitle: 'İletişim Bilgileri',
      messageTitle: 'Mesaj İçeriği',
      techTitle: 'Teknik Bilgiler',
      actionTitle: 'İnceleme Gerekli',
      actionText: 'Mesajı değerlendirmek için yönetici paneline giriş yapınız.',
      footerText: 'MyUNI Eğitim Platformu - Otomatik Bildirim Sistemi',
      submissionNo: 'Mesaj No:',
      date: 'Tarih:',
      name: 'Ad Soyad:',
      emailLabel: 'E-posta:',
      phoneLabel: 'Telefon:',
      ipLabel: 'IP Adresi:',
      browserLabel: 'Tarayıcı:',
      osLabel: 'İşletim Sistemi:',
      deviceLabel: 'Cihaz Tipi:',
      notProvided: 'Belirtilmedi'
    },
    en: {
      title: 'New Contact Message',
      newBadge: 'New',
      subtitle: 'MyUNI Eğitim Platformu',
      alertText: 'A new contact message has been received.',
      infoTitle: 'Contact Information',
      messageTitle: 'Message Content',
      techTitle: 'Technical Information',
      actionTitle: 'Review Required',
      actionText: 'Log in to the admin panel to evaluate the message.',
      footerText: 'MyUNI Eğitim Platformu - Automatic Notification System',
      submissionNo: 'Message No:',
      date: 'Date:',
      name: 'Name:',
      emailLabel: 'Email:',
      phoneLabel: 'Phone:',
      ipLabel: 'IP Address:',
      browserLabel: 'Browser:',
      osLabel: 'Operating System:',
      deviceLabel: 'Device Type:',
      notProvided: 'Not provided'
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
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #171717;
          background-color: #f8f9fa;
          padding: 20px;
        }
        .container {
          max-width: 700px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }
        .header {
          padding: 32px 30px;
          background-color: #fef2f2;
          border-bottom: 1px solid #fecaca;
        }
        .alert-badge {
          display: inline-block;
          background-color: #a90013;
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 12px;
        }
        .header h1 {
          font-size: 18px;
          font-weight: 500;
          color: #171717;
          margin-bottom: 8px;
        }
        .header-subtitle {
          font-size: 14px;
          color: #6b7280;
        }
        .content {
          padding: 32px 30px;
        }
        .alert-message {
          background-color: #fff7ed;
          border: 1px solid #fed7aa;
          border-left: 3px solid #a90013;
          padding: 16px;
          margin-bottom: 24px;
          border-radius: 4px;
        }
        .alert-text {
          font-size: 14px;
          color: #9a3412;
          font-weight: 500;
        }
        .section {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 24px;
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 16px;
          font-weight: 500;
          color: #171717;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        .info-row {
          display: flex;
          margin-bottom: 8px;
          font-size: 14px;
          align-items: baseline;
        }
        .info-row:last-child {
          margin-bottom: 0;
        }
        .info-label {
          font-weight: 500;
          color: #6b7280;
          width: 120px;
          flex-shrink: 0;
        }
        .info-value {
          color: #171717;
          word-break: break-word;
        }
        .message-content {
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 16px;
          font-size: 14px;
          line-height: 1.6;
          color: #171717;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .action-section {
          background-color: #171717;
          color: #ffffff;
          padding: 24px;
          text-align: center;
          margin-top: 20px;
        }
        .action-section h3 {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 8px;
        }
        .action-section p {
          font-size: 14px;
          opacity: 0.8;
        }
        .footer {
          padding: 20px 30px;
          background-color: #f9fafb;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }
        .footer p {
          font-size: 12px;
          color: #9ca3af;
        }
        @media (max-width: 600px) {
          body {
            padding: 10px;
          }
          .header, .content {
            padding: 20px;
          }
          .section {
            padding: 20px;
          }
          .info-row {
            flex-direction: column;
            margin-bottom: 12px;
          }
          .info-label {
            width: auto;
            margin-bottom: 4px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="alert-badge">${t.newBadge}</div>
          <h1>${t.title}</h1>
          <div class="header-subtitle">${t.subtitle}</div>
        </div>
        
        <div class="content">
          <div class="alert-message">
            <div class="alert-text">
              ${t.alertText}
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">${t.infoTitle}</div>
            <div class="info-row">
              <div class="info-label">${t.submissionNo}</div>
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
              <div class="info-label">${t.phoneLabel}</div>
              <div class="info-value">${phone || t.notProvided}</div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">${t.messageTitle}</div>
            <div class="message-content">${message}</div>
          </div>
          
          <div class="section">
            <div class="section-title">${t.techTitle}</div>
            <div class="info-row">
              <div class="info-label">${t.ipLabel}</div>
              <div class="info-value">${clientInfo.ip}</div>
            </div>
            <div class="info-row">
              <div class="info-label">${t.browserLabel}</div>
              <div class="info-value">${clientInfo.browser}</div>
            </div>
            <div class="info-row">
              <div class="info-label">${t.osLabel}</div>
              <div class="info-value">${clientInfo.os}</div>
            </div>
            <div class="info-row">
              <div class="info-label">${t.deviceLabel}</div>
              <div class="info-value">${clientInfo.device}</div>
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

// Send email function with improved error handling
const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    // Test SMTP connection silently
    await transporter.verify();

    const mailOptions = {
      from: `"MyUNI Eğitim Platformu" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
    };

    const result = await transporter.sendMail(mailOptions);
    
    // Only log success without sensitive info
    if (process.env.NODE_ENV === 'development') {
      console.log(`Email sent successfully - MessageID: ${result.messageId}`);
    }
    
    return true;
  } catch (emailError) {
    // Log errors but without sensitive data
    if (process.env.NODE_ENV === 'development') {
      console.error('Email sending failed:', emailError instanceof Error ? emailError.message : 'Unknown error');
    }
    
    throw new Error('Email sending failed');
  }
};

// hCaptcha verification
async function verifyHCaptcha(token: string, clientIP: string): Promise<CaptchaResult> {
  try {
    const hcaptchaSecret = process.env.HCAPTCHA_SECRET_KEY;
    
    if (!hcaptchaSecret) {
      return { success: false, error: 'hCaptcha configuration error' };
    }

    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: hcaptchaSecret,
        response: token,
        remoteip: clientIP
      }).toString(),
    });

    const data = await response.json();
    
    if (!data.success) {
      return { 
        success: false, 
        error: data['error-codes']?.join(', ') || 'Verification failed' 
      };
    }

    return { success: true };
  } catch (error) {
    console.error('hCaptcha verification error:', error);
    return { success: false, error: 'Verification service error' };
  }
}

// Spam detection helper
function detectSpam(data: SpamCheckData): SpamCheckResult {
  // Honeypot check
  if (data.honeypot && data.honeypot.trim() !== '') {
    return { isSpam: true, reason: 'Honeypot filled' };
  }

  // Time-based check (form filled too quickly)
  const currentTime = Date.now();
  const formLoadTime = data.timestamp || currentTime;
  const timeDiff = currentTime - formLoadTime;
  
  if (timeDiff < 3000) { // Less than 3 seconds
    return { isSpam: true, reason: 'Form submitted too quickly' };
  }

  // Basic content checks
  const message = data.message?.toLowerCase() || '';
  const email = data.email?.toLowerCase() || '';
  
  // Check for suspicious patterns
  const spamKeywords = ['casino', 'bitcoin', 'crypto', 'loan', 'viagra', 'cialis'];
  const hasSpamKeywords = spamKeywords.some(keyword => 
    message.includes(keyword) || email.includes(keyword)
  );
  
  if (hasSpamKeywords) {
    return { isSpam: true, reason: 'Contains spam keywords' };
  }

  // Check for excessive links
  const linkCount = (message.match(/http[s]?:\/\//g) || []).length;
  if (linkCount > 2) {
    return { isSpam: true, reason: 'Too many links' };
  }

  return { isSpam: false };
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cloudflareIP = request.headers.get('cf-connecting-ip');
  
  if (cloudflareIP) return cloudflareIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    let body: ContactFormData;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Extract and validate required fields
    const {
      firstName,
      lastName,
      email,
      phone,
      message,
      locale = 'tr',
      browser,
      operatingSystem,
      deviceType,
      honeypot,
      timestamp,
      hCaptchaToken
    } = body;

    // Basic validation
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    // hCaptcha validation
    if (!hCaptchaToken) {
      return NextResponse.json(
        { error: 'Captcha verification required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get client information
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Verify hCaptcha
    const captchaResult = await verifyHCaptcha(hCaptchaToken, clientIP);
    
    if (!captchaResult.success) {
      return NextResponse.json(
        { error: 'Captcha verification failed' },
        { status: 400 }
      );
    }

    // Spam detection
    const spamCheck = detectSpam({
      honeypot,
      timestamp,
      message,
      email
    });

    // Prepare data for database
    const submissionData = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      message: message.trim(),
      locale: locale,
      honeypot: honeypot || null,
      form_timestamp: timestamp || Date.now(),
      browser_info: browser || null,
      operating_system: operatingSystem || null,
      device_type: deviceType || 'Unknown',
      ip_address: clientIP,
      user_agent: userAgent,
      status: spamCheck.isSpam ? 'spam' : 'new',
      is_spam: spamCheck.isSpam,
      admin_notes: spamCheck.reason ? `${spamCheck.reason} | hCaptcha verified` : 'hCaptcha verified'
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from('unilab_vision_contact_submissions')
      .insert([submissionData])
      .select()
      .single();

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Database error:', error.message);
      }
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      );
    }

    // If it's spam, return success but don't send emails
    if (spamCheck.isSpam) {
      return NextResponse.json({
        success: true,
        message: 'Message received successfully',
        submissionId: data.id
      });
    }

    // Send emails for legitimate submissions
    const clientInfo: ClientInfo = {
      ip: clientIP,
      browser: browser || 'Unknown',
      os: operatingSystem || 'Unknown',
      device: deviceType || 'Unknown'
    };

    const errors: string[] = [];
    let confirmationSent = false;
    let notificationsSent = 0;
    const totalNotifications = (process.env.NOTIFICATION_EMAILS?.split(',') || ['info@myunilab.net']).length;

    // Send confirmation email to user
    try {
      await sendEmail(
        email,
        locale === 'tr' ? 'Mesajınızı Aldık - MyUNI Eğitim Platformu' : 'We Received Your Message - MyUNI Eğitim Platformu',
        generateConfirmationEmail(firstName, lastName, data.id, locale)
      );
      confirmationSent = true;
    } catch (confirmationError) {
      const errorMessage = confirmationError instanceof Error ? confirmationError.message : 'Unknown error occurred';
      errors.push(`Failed to send confirmation email: ${errorMessage}`);
    }

    // Send notification email to admin(s)
    const notificationEmails = process.env.NOTIFICATION_EMAILS?.split(',') || ['info@myunilab.net'];
    
    for (const adminEmail of notificationEmails) {
      const cleanEmail = adminEmail.trim();
      if (!cleanEmail) continue;
      
      try {
        await sendEmail(
          cleanEmail,
          locale === 'tr' ? 'Yeni İletişim Mesajı - MyUNI Eğitim Platformu' : 'New Contact Message - MyUNI Eğitim Platformu',
          generateNotificationEmail(firstName, lastName, email, phone || '', message, data.id, clientInfo, locale)
        );
        notificationsSent++;
      } catch (notificationError) {
        const errorMessage = notificationError instanceof Error ? notificationError.message : 'Unknown error occurred';
        errors.push(`Failed to send notification email to ${cleanEmail}: ${errorMessage}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      submissionId: data.id,
      emailsSent: {
        userEmail: confirmationSent,
        adminEmails: notificationsSent,
        totalAdminEmails: totalNotifications,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (generalError) {
    const errorMessage = generalError instanceof Error ? generalError.message : 'Unknown error';
    
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Contact form API error:', errorMessage);
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}