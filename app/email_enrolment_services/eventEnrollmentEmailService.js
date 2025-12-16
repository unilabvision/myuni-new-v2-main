// app/email_enrolment_services/eventEnrollmentEmailService.js
import nodemailer from 'nodemailer';

// Send event enrollment confirmation email
const sendEventEnrollmentEmail = async (userInfo, eventInfo, enrollmentInfo, locale = 'tr') => {
  try {
    console.log('🚀 Starting event enrollment email send process...');
    console.log('📧 Email data received:', { 
      to: userInfo.email, 
      name: userInfo.name, 
      event: eventInfo.title,
      enrollmentId: enrollmentInfo.id
    });
    console.log('Nodemailer loaded successfully');
    
    // Check environment variables
    console.log('🔍 Checking email environment variables...');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST ? '✓ Set' : '❌ Missing');
    console.log('EMAIL_PORT:', process.env.EMAIL_PORT || 'Using default 587');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✓ Set' : '❌ Missing');
    console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✓ Set' : '❌ Missing');
    
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('Missing required email configuration. Please check EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD environment variables.');
    }
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    console.log('Transporter created successfully');
    
    // Verify transporter
    await transporter.verify();
    console.log('Transporter verified successfully');
    
    const isTurkish = locale === 'tr';
    
    // Email subject - similar to course purchase confirmation
    const subject = isTurkish 
      ? `${eventInfo.title} - Etkinlik Kayıt Onayı`
      : `${eventInfo.title} - Event Registration Confirmation`;
    
    const greeting = isTurkish 
      ? `Sayın ${userInfo.name}`
      : `Dear ${userInfo.name}`;
    
    // Main message - similar to course purchase confirmation
    const thankYou = isTurkish
      ? 'MyUNI\'yi tercih ettiğiniz için teşekkürler.'
      : 'Thank you for choosing MyUNI.';
    
    const registrationComplete = isTurkish
      ? 'Etkinlik kaydınız tamamlandı. Etkinlik detayları aşağıda yer almaktadır.'
      : 'Your event registration is complete. Event details are provided below.';
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://myunilab.net';
    const eventUrl = `${baseUrl}/${locale}/etkinlik/${eventInfo.slug}`;
    const dashboardUrl = `${baseUrl}/${locale}/dashboard`;
    
    // Format event dates - Convert to Turkey timezone (UTC+3)
    const formatEventDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      // Add 3 hours for Turkey timezone
      const turkeyDate = new Date(date.getTime() + (3 * 60 * 60 * 1000));
      return turkeyDate.toLocaleDateString(isTurkish ? 'tr-TR' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        timeZone: 'UTC' // Use UTC since we already adjusted the time
      });
    };
    
    const formatEventTime = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      // Add 3 hours for Turkey timezone
      const turkeyDate = new Date(date.getTime() + (3 * 60 * 60 * 1000));
      return turkeyDate.toLocaleTimeString(isTurkish ? 'tr-TR' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC' // Use UTC since we already adjusted the time
      });
    };

    // Calendar integration functions
    const generateCalendarLinks = (eventInfo) => {
      const startDate = new Date(eventInfo.start_date);
      const endDate = eventInfo.end_date ? new Date(eventInfo.end_date) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours if no end date
      
      // Add 3 hours for Turkey timezone
      const turkeyStartDate = new Date(startDate.getTime() + (3 * 60 * 60 * 1000));
      const turkeyEndDate = new Date(endDate.getTime() + (3 * 60 * 60 * 1000));
      
      // Format dates for calendar URLs (YYYYMMDDTHHMMSSZ)
      const formatCalendarDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };
      
      const startDateFormatted = formatCalendarDate(turkeyStartDate);
      const endDateFormatted = formatCalendarDate(turkeyEndDate);
      
      // Event details for calendar
      const eventTitle = eventInfo.title;
      
      // Clean markdown from description for calendar
      const cleanDescription = (eventInfo.description || '')
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
        .replace(/__(.*?)__/g, '$1') // Remove bold underscore markdown
        .replace(/_(.*?)_/g, '$1') // Remove italic underscore markdown
        .replace(/`(.*?)`/g, '$1') // Remove code markdown
        .replace(/#{1,6}\s*/g, '') // Remove headers
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
        .replace(/\n\s*\n/g, '\n') // Remove extra line breaks
        .trim();
      
      const eventDescription = cleanDescription;
      const eventLocation = eventInfo.is_online && eventInfo.meeting_url 
        ? eventInfo.meeting_url 
        : eventInfo.location_address || '';
      
      // Google Calendar URL
      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startDateFormatted}/${endDateFormatted}&details=${encodeURIComponent(eventDescription)}&location=${encodeURIComponent(eventLocation)}`;
      
      // Outlook Calendar URL
      const outlookCalendarUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(eventTitle)}&startdt=${startDateFormatted}&enddt=${endDateFormatted}&body=${encodeURIComponent(eventDescription)}&location=${encodeURIComponent(eventLocation)}`;
      
      // Apple Calendar URL (using Google Calendar as fallback - most reliable)
      const appleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startDateFormatted}/${endDateFormatted}&details=${encodeURIComponent(eventDescription)}&location=${encodeURIComponent(eventLocation)}`;
      
      return {
        google: googleCalendarUrl,
        outlook: outlookCalendarUrl,
        apple: appleCalendarUrl
      };
    };
    
    const startDate = formatEventDate(eventInfo.start_date);
    const startTime = formatEventTime(eventInfo.start_date);
    const endDate = formatEventDate(eventInfo.end_date);
    const endTime = formatEventTime(eventInfo.end_date);
    
    // Generate calendar links
    const calendarLinks = generateCalendarLinks(eventInfo);
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      line-height: 1.6;
      color: #000000;
      background-color: #ffffff;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e0e0e0;
    }
    .header {
      padding: 30px;
      border-bottom: 2px solid #990000;
      text-align: left;
    }
    .logo {
      font-size: 24px;
      font-weight: 600;
      color: #000000;
      letter-spacing: 1px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
      color: #000000;
    }
    .message {
      font-size: 16px;
      margin-bottom: 30px;
      color: #000000;
      line-height: 1.5;
    }
    .highlight {
      color: #990000;
      font-weight: 500;
    }
    .event-title {
      font-size: 18px;
      font-weight: 500;
      color: #000000;
      margin: 20px 0;
      padding: 15px 0;
      border-top: 1px solid #e0e0e0;
      border-bottom: 1px solid #e0e0e0;
    }
    .event-details {
      background-color: #f8f8f8;
      padding: 25px;
      margin: 25px 0;
      border-left: 4px solid #990000;
    }
    .event-details h3 {
      font-size: 16px;
      font-weight: 600;
      color: #990000;
      margin-bottom: 15px;
    }
    .detail-row {
      display: flex;
      margin-bottom: 12px;
      font-size: 14px;
      padding: 5px 0;
    }
    .detail-label {
      font-weight: 500;
      color: #666666;
      width: 120px;
      flex-shrink: 0;
    }
    .detail-value {
      color: #000000;
    }
    .button-section {
      text-align: left;
      margin: 35px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #990000;
      color: #ffffff !important;
      padding: 14px 28px;
      text-decoration: none;
      font-weight: 500;
      font-size: 14px;
      letter-spacing: 0.5px;
      transition: background-color 0.2s;
    }
    .cta-button:hover {
      background-color: #660000;
    }
    .note {
      background-color: #f8f8f8;
      padding: 20px;
      margin: 25px 0;
      font-size: 14px;
      color: #666666;
      line-height: 1.5;
      border-left: 3px solid #e0e0e0;
    }
    .steps {
      margin: 25px 0;
    }
    .steps h3 {
      font-size: 16px;
      font-weight: 500;
      color: #000000;
      margin-bottom: 15px;
    }
    .steps ol {
      padding-left: 20px;
    }
    .steps li {
      margin-bottom: 8px;
      color: #666666;
      font-size: 14px;
      line-height: 1.4;
    }
    .contact {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: left;
    }
    .contact h3 {
      font-size: 14px;
      font-weight: 500;
      color: #000000;
      margin-bottom: 8px;
    }
    .contact a {
      color: #990000;
      text-decoration: none;
      font-size: 14px;
    }
    .footer {
      padding: 20px 30px;
      background-color: #f8f8f8;
      border-top: 1px solid #e0e0e0;
      text-align: center;
    }
    .footer p {
      font-size: 12px;
      color: #999999;
      margin-bottom: 5px;
    }
    .online-indicator {
      display: inline-block;
      background-color: #28a745;
      color: #ffffff;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      margin-left: 10px;
    }
    .offline-indicator {
      display: inline-block;
      background-color: #6c757d;
      color: #ffffff;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      margin-left: 10px;
    }
    .calendar-section {
      margin: 30px 0;
      text-align: center;
    }
    .calendar-section h3 {
      font-size: 16px;
      font-weight: 500;
      color: #000000;
      margin-bottom: 15px;
    }
    .calendar-buttons {
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }
    .calendar-button {
      display: inline-block;
      background-color: #f8f8f8;
      color: #000000 !important;
      padding: 12px 20px;
      text-decoration: none;
      font-weight: 500;
      font-size: 13px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      transition: all 0.2s;
      min-width: 130px;
      text-align: center;
      margin: 5px;
    }
    .calendar-button:hover {
      background-color: #e8e8e8;
      border-color: #990000;
    }
    .calendar-button.google:hover {
      background-color: #4285f4;
      color: #ffffff !important;
    }
    .calendar-button.outlook:hover {
      background-color: #0078d4;
      color: #ffffff !important;
    }
    .calendar-button.apple:hover {
      background-color: #000000;
      color: #ffffff !important;
    }
    @media (max-width: 600px) {
      body {
        padding: 10px;
      }
      .header, .content {
        padding: 20px;
      }
      .detail-row {
        flex-direction: column;
        margin-bottom: 12px;
      }
      .detail-label {
        width: auto;
        margin-bottom: 2px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">MyUNI</div>
    </div>
    
    <div class="content">
      <div class="greeting">
        ${greeting},
      </div>
      
      <div class="message">
        <span class="highlight">${thankYou}</span><br>
        ${registrationComplete}
      </div>
      
      <div class="event-title">
        ${eventInfo.title}
        ${eventInfo.is_online ? 
          '<span class="online-indicator">' + (isTurkish ? 'Çevrimiçi' : 'Online') + '</span>' : 
          '<span class="offline-indicator">' + (isTurkish ? 'Yüz Yüze' : 'In-Person') + '</span>'
        }
      </div>
      
      <div class="event-details">
        <h3>${isTurkish ? 'Etkinlik Detayları' : 'Event Details'}</h3>
        <div class="detail-row">
          <div class="detail-label">${isTurkish ? 'Başlangıç' : 'Start'}:</div>
          <div class="detail-value">${startDate} - ${startTime}</div>
        </div>
        ${eventInfo.end_date ? `
        <div class="detail-row">
          <div class="detail-label">${isTurkish ? 'Bitiş' : 'End'}:</div>
          <div class="detail-value">${endDate} - ${endTime}</div>
        </div>
        ` : ''}
        ${eventInfo.location_address ? `
        <div class="detail-row">
          <div class="detail-label">${isTurkish ? 'Konum' : 'Location'}:</div>
          <div class="detail-value">${eventInfo.location_address}</div>
        </div>
        ` : ''}
        ${eventInfo.meeting_url ? `
        <div class="detail-row">
          <div class="detail-label">${isTurkish ? 'Etkinlik Linki' : 'Event Link'}:</div>
          <div class="detail-value">
            <a href="${eventInfo.meeting_url}" style="color: #990000; text-decoration: none;">${isTurkish ? 'Katılım Linki' : 'Join Meeting'}</a>
          </div>
        </div>
        ` : ''}
        ${eventInfo.organizer_name ? `
        <div class="detail-row">
          <div class="detail-label">${isTurkish ? 'Organizatör' : 'Organizer'}:</div>
          <div class="detail-value">${eventInfo.organizer_name}</div>
        </div>
        ` : ''}
        <div class="detail-row">
          <div class="detail-label">${isTurkish ? 'Etkinlik' : 'Event'}:</div>
          <div class="detail-value">${eventInfo.title}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">${isTurkish ? 'Kayıt No' : 'Registration ID'}:</div>
          <div class="detail-value">${enrollmentInfo.id}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">${isTurkish ? 'Tarih' : 'Date'}:</div>
          <div class="detail-value">${formatEventDate(enrollmentInfo.enrolled_at)}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">${isTurkish ? 'E-posta' : 'Email'}:</div>
          <div class="detail-value">${userInfo.email}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">${isTurkish ? 'Tutar' : 'Amount'}:</div>
          <div class="detail-value">${isTurkish ? 'Ücretsiz' : 'Free'}</div>
        </div>
      </div>
      
      <div class="calendar-section">
        <h3>${isTurkish ? 'Takvime Ekle' : 'Add to Calendar'}</h3>
        <div class="calendar-buttons">
          <a href="${calendarLinks.google}" class="calendar-button google" target="_blank">
            📅 Google Calendar
          </a>
          <a href="${calendarLinks.outlook}" class="calendar-button outlook" target="_blank">
            📅 Outlook
          </a>
          <a href="${calendarLinks.apple}" class="calendar-button apple" target="_blank">
            📅 Apple/iCal
          </a>
        </div>
      </div>
      
      <div class="button-section">
        <a href="${eventUrl}" class="cta-button">
          ${isTurkish ? 'Etkinliğim' : 'My Event'}
        </a>
      </div>
      
      <div class="steps">
        <h3>${isTurkish ? 'Sonraki Adımlar' : 'Next Steps'}</h3>
        <ol>
          <li>${isTurkish ? 'Etkinlik tarihini takviminize ekleyin' : 'Add the event date to your calendar'}</li>
          <li>${isTurkish ? 'Etkinlik öncesi hatırlatma emaili alacaksınız' : 'You will receive a reminder email before the event'}</li>
          ${eventInfo.is_online ? `
          <li>${isTurkish ? 'Etkinlik başlamadan 10 dakika önce toplantı linkine tıklayın' : 'Click the meeting link 10 minutes before the event starts'}</li>
          ` : `
          <li>${isTurkish ? 'Etkinlik yerine zamanında gelin' : 'Arrive at the event location on time'}</li>
          `}
          <li>${isTurkish ? 'Etkinlik sonrası sertifikanızı alacaksınız' : 'You will receive your certificate after the event'}</li>
        </ol>
      </div>
      
      <div class="note">
        ${isTurkish 
          ? 'Etkinlik ile ilgili herhangi bir sorunuz olursa veya kaydınızı iptal etmek isterseniz bizimle iletişime geçebilirsiniz.'
          : 'If you have any questions about the event or need to cancel your registration, please contact us.'
        }
      </div>
      
      <div class="contact">
        <h3>${isTurkish ? 'Destek' : 'Support'}</h3>
        <a href="mailto:info@myunilab.net">info@myunilab.net</a>
      </div>
    </div>
    
    <div class="footer">
      <p>${isTurkish ? 'Bu e-posta otomatik olarak gönderilmiştir.' : 'This email was sent automatically.'}</p>
      <p>© 2025 MyUNI</p>
    </div>
  </div>
</body>
</html>`;

    const textContent = `
${greeting},

${thankYou}
${registrationComplete}

--- ${isTurkish ? 'ETKİNLİK DETAYLARI' : 'EVENT DETAILS'} ---
${isTurkish ? 'Etkinlik' : 'Event'}: ${eventInfo.title}
${isTurkish ? 'Kayıt No' : 'Registration ID'}: ${enrollmentInfo.id}
${isTurkish ? 'Tarih' : 'Date'}: ${formatEventDate(enrollmentInfo.enrolled_at)}
${isTurkish ? 'E-posta' : 'Email'}: ${userInfo.email}
${isTurkish ? 'Tutar' : 'Amount'}: ${isTurkish ? 'Ücretsiz' : 'Free'}
${isTurkish ? 'Başlangıç' : 'Start'}: ${startDate} - ${startTime}
${eventInfo.end_date ? `${isTurkish ? 'Bitiş' : 'End'}: ${endDate} - ${endTime}` : ''}
${eventInfo.location_address ? `${isTurkish ? 'Konum' : 'Location'}: ${eventInfo.location_address}` : ''}
${eventInfo.meeting_url ? `${isTurkish ? 'Toplantı Linki' : 'Meeting Link'}: ${eventInfo.meeting_url}` : ''}
${eventInfo.organizer_name ? `${isTurkish ? 'Organizatör' : 'Organizer'}: ${eventInfo.organizer_name}` : ''}

${isTurkish ? 'Etkinlik detayları için' : 'View event details'}: ${eventUrl}
${isTurkish ? 'Dashboard sayfası' : 'Dashboard page'}: ${dashboardUrl}

--- ${isTurkish ? 'TAKVİME EKLE' : 'ADD TO CALENDAR'} ---
${isTurkish ? 'Google Calendar' : 'Google Calendar'}: ${calendarLinks.google}
${isTurkish ? 'Outlook' : 'Outlook'}: ${calendarLinks.outlook}
${isTurkish ? 'Apple/iCal' : 'Apple/iCal'}: ${calendarLinks.apple}

${isTurkish ? 'İletişim' : 'Contact'}: info@myunilab.net

${isTurkish ? 'Etkinliğinizde görüşmek üzere!' : 'See you at the event!'}
MyUNI Ekibi
`;

    const mailOptions = {
      from: {
        name: 'MyUNI',
        address: process.env.EMAIL_USER
      },
      to: userInfo.email,
      subject: subject,
      html: htmlContent,
      text: textContent,
      bcc: process.env.NOTIFICATION_EMAILS ? process.env.NOTIFICATION_EMAILS.split(',') : []
    };
    
    console.log('Sending event enrollment email to:', userInfo.email);
    console.log('Email subject:', subject);
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Event enrollment email sent successfully!');
    console.log('📨 Message ID:', result.messageId);
    console.log('📮 Email delivered to:', userInfo.email);
    
    return {
      success: true,
      messageId: result.messageId
    };
    
  } catch (error) {
    console.error('Event enrollment email send error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return {
      success: false,
      error: error.message
    };
  }
};

// Test event enrollment email functionality
const sendTestEventEnrollmentEmail = async (to, locale = 'tr') => {
  const testUserInfo = {
    name: 'Test User',
    email: to
  };
  
  const testEventInfo = {
    title: 'Test Event - Email Functionality',
    slug: 'test-event',
    description: 'This is a test event for email functionality verification',
    start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
    is_online: true,
    meeting_url: 'https://meet.google.com/test-link',
    organizer_name: 'Test Organizer',
    location_name: null
  };
  
  const testEnrollmentInfo = {
    id: 'TEST_ENROLLMENT_' + Date.now(),
    enrolled_at: new Date().toISOString()
  };
  
  return await sendEventEnrollmentEmail(testUserInfo, testEventInfo, testEnrollmentInfo, locale);
};

export {
  sendEventEnrollmentEmail,
  sendTestEventEnrollmentEmail
};