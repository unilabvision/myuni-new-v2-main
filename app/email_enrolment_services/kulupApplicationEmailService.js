// app/email_enrolment_services/kulupApplicationEmailService.js
import nodemailer from 'nodemailer';

// Send club application confirmation email to club
const sendClubApplicationConfirmationEmail = async (clubInfo, applicationData, locale = 'tr') => {
  try {
    console.log('🚀 Starting club application confirmation email send process...');
    console.log('📧 Email data received:', { 
      to: clubInfo.email, 
      clubName: clubInfo.clubName, 
      representativeName: clubInfo.representativeName
    });
    
    // Check environment variables
    console.log('🔍 Checking email environment variables...');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST ? '✓ Set' : '❌ Missing');
    console.log('EMAIL_PORT:', process.env.EMAIL_PORT || 'Using default 587');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✓ Set' : '❌ Missing');
    console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✓ Set' : '❌ Missing');
    console.log('EMAIL_SECURE:', process.env.EMAIL_SECURE || 'false');
    
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
    
    // Email subject
    const subject = isTurkish 
      ? `MyUNI Kulüp Ağı Başvurunuz Alındı - ${clubInfo.clubName}`
      : `MyUNI Club Network Application Received - ${clubInfo.clubName}`;
    
    const greeting = isTurkish 
      ? `Sayın ${clubInfo.representativeName}`
      : `Dear ${clubInfo.representativeName}`;
    
    const thankYou = isTurkish
      ? 'MyUNI Kulüp Ağı\'na başvurunuz için teşekkürler.'
      : 'Thank you for your application to MyUNI Club Network.';
    
    const applicationReceived = isTurkish
      ? 'Başvurunuz başarıyla alınmıştır. Değerlendirme sürecimiz devam etmektedir.'
      : 'Your application has been successfully received. Our evaluation process is ongoing.';
    
    const nextSteps = isTurkish
      ? 'Başvurunuz değerlendirildikten sonra sizinle iletişime geçeceğiz.'
      : 'We will contact you after your application is evaluated.';
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://myunilab.net';
    const contactEmail = 'info@myunilab.net';
    
    // HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="${locale}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #990000; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9f9f9; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
          .button { display: inline-block; background: #990000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .info-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #990000; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MyUNI Kulüp Ağı</h1>
            <p>${isTurkish ? 'Başvuru Onayı' : 'Application Confirmation'}</p>
          </div>
          
          <div class="content">
            <h2>${greeting}</h2>
            
            <p>${thankYou}</p>
            <p>${applicationReceived}</p>
            
            <div class="info-box">
              <h3>${isTurkish ? 'Başvuru Bilgileri' : 'Application Information'}</h3>
              <p><strong>${isTurkish ? 'Kulüp Adı:' : 'Club Name:'}</strong> ${clubInfo.clubName}</p>
              <p><strong>${isTurkish ? 'Üniversite:' : 'University:'}</strong> ${clubInfo.university}</p>
              <p><strong>${isTurkish ? 'Temsilci:' : 'Representative:'}</strong> ${clubInfo.representativeName}</p>
              <p><strong>${isTurkish ? 'E-posta:' : 'Email:'}</strong> ${clubInfo.email}</p>
            </div>
            
            <p>${nextSteps}</p>
            
            <p>${isTurkish ? 'Sorularınız için bizimle iletişime geçebilirsiniz:' : 'You can contact us for any questions:'}</p>
            <p>📧 <a href="mailto:${contactEmail}">${contactEmail}</a></p>
          </div>
          
          <div class="footer">
            <p>© 2024 MyUNI. ${isTurkish ? 'Tüm hakları saklıdır.' : 'All rights reserved.'}</p>
            <p><a href="${baseUrl}" style="color: #990000;">${baseUrl}</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Plain text version
    const textContent = `
${greeting}

${thankYou}
${applicationReceived}

${isTurkish ? 'Başvuru Bilgileri:' : 'Application Information:'}
${isTurkish ? 'Kulüp Adı:' : 'Club Name:'} ${clubInfo.clubName}
${isTurkish ? 'Üniversite:' : 'University:'} ${clubInfo.university}
${isTurkish ? 'Temsilci:' : 'Representative:'} ${clubInfo.representativeName}
${isTurkish ? 'E-posta:' : 'Email:'} ${clubInfo.email}

${nextSteps}

${isTurkish ? 'Sorularınız için bizimle iletişime geçebilirsiniz:' : 'You can contact us for any questions:'}
📧 ${contactEmail}

© 2024 MyUNI. ${isTurkish ? 'Tüm hakları saklıdır.' : 'All rights reserved.'}
${baseUrl}
    `;
    
    // Send email
    const mailOptions = {
      from: `"MyUNI" <${process.env.EMAIL_USER}>`,
      to: clubInfo.email,
      subject: subject,
      text: textContent,
      html: htmlContent
    };
    
    console.log('📤 Sending club application confirmation email...');
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Club application confirmation email sent successfully:', result.messageId);
    
    return {
      success: true,
      messageId: result.messageId,
      message: 'Club application confirmation email sent successfully'
    };
    
  } catch (error) {
    console.error('❌ Error sending club application confirmation email:', error);
    throw error;
  }
};

// Send new club application notification email to MyUNI team
const sendNewClubApplicationNotificationEmail = async (clubInfo, applicationData, locale = 'tr') => {
  try {
    console.log('🚀 Starting new club application notification email send process...');
    console.log('📧 Notification email data:', { 
      clubName: clubInfo.clubName, 
      representativeName: clubInfo.representativeName,
      email: clubInfo.email
    });
    
    // Check environment variables
    console.log('🔍 Checking email environment variables for notification...');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST ? '✓ Set' : '❌ Missing');
    console.log('EMAIL_PORT:', process.env.EMAIL_PORT || 'Using default 587');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✓ Set' : '❌ Missing');
    console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✓ Set' : '❌ Missing');
    console.log('EMAIL_SECURE:', process.env.EMAIL_SECURE || 'false');
    
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
    
    await transporter.verify();
    console.log('Transporter verified successfully');
    
    const isTurkish = locale === 'tr';
    
    // Email subject
    const subject = isTurkish 
      ? `Yeni Kulüp Başvurusu - ${clubInfo.clubName}`
      : `New Club Application - ${clubInfo.clubName}`;
    
    const newApplication = isTurkish
      ? 'Yeni bir kulüp başvurusu alındı!'
      : 'A new club application has been received!';
    
    const applicationDetails = isTurkish
      ? 'Başvuru detayları aşağıda yer almaktadır:'
      : 'Application details are provided below:';
    
    // HTML email template for MyUNI team
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="${locale}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #990000; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9f9f9; }
          .info-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #990000; }
          .highlight { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MyUNI Kulüp Ağı</h1>
            <p>${newApplication}</p>
          </div>
          
          <div class="content">
            <div class="highlight">
              <h2>${isTurkish ? 'Yeni Başvuru!' : 'New Application!'}</h2>
              <p>${applicationDetails}</p>
            </div>
            
            <div class="info-box">
              <h3>${isTurkish ? 'Kulüp Bilgileri' : 'Club Information'}</h3>
              <p><strong>${isTurkish ? 'Kulüp Adı:' : 'Club Name:'}</strong> ${clubInfo.clubName}</p>
              <p><strong>${isTurkish ? 'Üniversite:' : 'University:'}</strong> ${clubInfo.university}</p>
              <p><strong>${isTurkish ? 'Kulüp Türü:' : 'Club Type:'}</strong> ${clubInfo.clubType}</p>
              <p><strong>${isTurkish ? 'Üye Sayısı:' : 'Member Count:'}</strong> ${clubInfo.memberCount}</p>
              <p><strong>${isTurkish ? 'Kuruluş Yılı:' : 'Founded Year:'}</strong> ${clubInfo.foundingYear}</p>
            </div>
            
            <div class="info-box">
              <h3>${isTurkish ? 'Temsilci Bilgileri' : 'Representative Information'}</h3>
              <p><strong>${isTurkish ? 'Ad Soyad:' : 'Full Name:'}</strong> ${clubInfo.representativeName}</p>
              <p><strong>${isTurkish ? 'Pozisyon:' : 'Position:'}</strong> ${clubInfo.position}</p>
              <p><strong>${isTurkish ? 'E-posta:' : 'Email:'}</strong> <a href="mailto:${clubInfo.email}">${clubInfo.email}</a></p>
              <p><strong>${isTurkish ? 'Telefon:' : 'Phone:'}</strong> ${clubInfo.phone}</p>
            </div>
            
            <div class="info-box">
              <h3>${isTurkish ? 'Kulüp Hakkında' : 'About the Club'}</h3>
              <p><strong>${isTurkish ? 'Amaç:' : 'Purpose:'}</strong> ${clubInfo.clubPurpose}</p>
              <p><strong>${isTurkish ? 'Etkinlik Türleri:' : 'Event Types:'}</strong> ${clubInfo.eventTypes}</p>
              <p><strong>${isTurkish ? 'Son Proje:' : 'Recent Project:'}</strong> ${clubInfo.recentProject}</p>
            </div>
            
            <div class="info-box">
              <h3>${isTurkish ? 'İş Birliği & Beklentiler' : 'Collaboration & Expectations'}</h3>
              <p><strong>${isTurkish ? 'Motivasyon:' : 'Motivation:'}</strong> ${clubInfo.motivation}</p>
              <p><strong>${isTurkish ? 'Beklentiler:' : 'Expectations:'}</strong> ${clubInfo.expectations}</p>
              <p><strong>${isTurkish ? 'Katkılar:' : 'Contributions:'}</strong> ${clubInfo.contributions}</p>
            </div>
            
            <p><strong>${isTurkish ? 'Başvuru Tarihi:' : 'Application Date:'}</strong> ${new Date().toLocaleString(isTurkish ? 'tr-TR' : 'en-US')}</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Plain text version
    const textContent = `
${newApplication}

${applicationDetails}

${isTurkish ? 'Kulüp Bilgileri:' : 'Club Information:'}
${isTurkish ? 'Kulüp Adı:' : 'Club Name:'} ${clubInfo.clubName}
${isTurkish ? 'Üniversite:' : 'University:'} ${clubInfo.university}
${isTurkish ? 'Kulüp Türü:' : 'Club Type:'} ${clubInfo.clubType}
${isTurkish ? 'Üye Sayısı:' : 'Member Count:'} ${clubInfo.memberCount}
${isTurkish ? 'Kuruluş Yılı:' : 'Founded Year:'} ${clubInfo.foundingYear}

${isTurkish ? 'Temsilci Bilgileri:' : 'Representative Information:'}
${isTurkish ? 'Ad Soyad:' : 'Full Name:'} ${clubInfo.representativeName}
${isTurkish ? 'Pozisyon:' : 'Position:'} ${clubInfo.position}
${isTurkish ? 'E-posta:' : 'Email:'} ${clubInfo.email}
${isTurkish ? 'Telefon:' : 'Phone:'} ${clubInfo.phone}

${isTurkish ? 'Kulüp Hakkında:' : 'About the Club:'}
${isTurkish ? 'Amaç:' : 'Purpose:'} ${clubInfo.clubPurpose}
${isTurkish ? 'Etkinlik Türleri:' : 'Event Types:'} ${clubInfo.eventTypes}
${isTurkish ? 'Son Proje:' : 'Recent Project:'} ${clubInfo.recentProject}

${isTurkish ? 'İş Birliği & Beklentiler:' : 'Collaboration & Expectations:'}
${isTurkish ? 'Motivasyon:' : 'Motivation:'} ${clubInfo.motivation}
${isTurkish ? 'Beklentiler:' : 'Expectations:'} ${clubInfo.expectations}
${isTurkish ? 'Katkılar:' : 'Contributions:'} ${clubInfo.contributions}

${isTurkish ? 'Başvuru Tarihi:' : 'Application Date:'} ${new Date().toLocaleString(isTurkish ? 'tr-TR' : 'en-US')}
    `;
    
    // Send email to MyUNI team
    const mailOptions = {
      from: `"MyUNI Kulüp Ağı" <${process.env.EMAIL_USER}>`,
      to: 'info@myunilab.net', // MyUNI team email
      subject: subject,
      text: textContent,
      html: htmlContent
    };
    
    console.log('📤 Sending new club application notification email...');
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ New club application notification email sent successfully:', result.messageId);
    
    return {
      success: true,
      messageId: result.messageId,
      message: 'New club application notification email sent successfully'
    };
    
  } catch (error) {
    console.error('❌ Error sending new club application notification email:', error);
    throw error;
  }
};

export { sendClubApplicationConfirmationEmail, sendNewClubApplicationNotificationEmail };
