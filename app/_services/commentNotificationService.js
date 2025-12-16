// app/_services/commentNotificationService.js - Comment Notification Service
import nodemailer from 'nodemailer';

// Send comment notification to admin
const sendCommentNotificationToAdmin = async (commentData, contentInfo, locale = 'tr', contentType = 'course') => {
  try {
    console.log('Starting admin comment notification email...');
    
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
    const isLowRating = commentData.rating < 3;
    const isEvent = contentType === 'event';
    
    const contentTypeText = isEvent 
      ? (isTurkish ? 'Etkinlik' : 'Event')
      : (isTurkish ? 'Kurs' : 'Course');
    
    const subject = isTurkish 
      ? `Yeni Yorum - ${contentInfo.title} (${commentData.rating}/5 ⭐)`
      : `New Comment - ${contentInfo.title} (${commentData.rating}/5 ⭐)`;
    
    const ratingText = isTurkish 
      ? `${commentData.rating} yıldız`
      : `${commentData.rating} stars`;
    
    const lowRatingWarning = isLowRating ? `
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #f39c12;">
        <strong style="color: #856404;">⚠️ ${isTurkish ? 'Düşük Puan Uyarısı' : 'Low Rating Alert'}</strong><br>
        <span style="color: #856404;">${isTurkish ? 'Bu yorum 3 puandan düşük. Kullanıcıya yardım formu gönderilmiştir.' : 'This comment has a rating below 3. A help form has been sent to the user.'}</span>
      </div>
    ` : '';
    
    const helpFormLink = isLowRating ? `
      <div style="background-color: #e8f5e8; border: 1px solid #c3e6c3; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #28a745;">
        <strong style="color: #155724;">${isTurkish ? 'Yardım Formu Gönderildi' : 'Help Form Sent'}</strong><br>
        <span style="color: #155724;">${isTurkish ? 'Kullanıcıya yardım formu linki gönderildi' : 'Help form link has been sent to the user'}</span>
      </div>
    ` : '';
    
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
    .comment-section {
      background-color: #f8f9fa;
      padding: 25px;
      margin: 25px 0;
      border-radius: 8px;
      border-left: 4px solid #990000;
    }
    .comment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .commenter-name {
      font-size: 18px;
      font-weight: 600;
      color: #000000;
    }
    .rating {
      font-size: 16px;
      color: #f39c12;
    }
    .comment-text {
      font-size: 16px;
      color: #333333;
      line-height: 1.6;
      margin: 15px 0;
      padding: 15px;
      background-color: #ffffff;
      border-radius: 5px;
      border: 1px solid #e0e0e0;
    }
    .course-info {
      background-color: #e8f4f8;
      padding: 20px;
      margin: 20px 0;
      border-radius: 5px;
      border-left: 4px solid #17a2b8;
    }
    .course-title {
      font-size: 18px;
      font-weight: 600;
      color: #000000;
      margin-bottom: 10px;
    }
    .course-link {
      color: #990000;
      text-decoration: none;
      font-weight: 500;
    }
    .details-section {
      margin: 30px 0;
    }
    .detail-row {
      display: flex;
      margin-bottom: 8px;
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
    .action-buttons {
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
      margin-right: 10px;
      border-radius: 4px;
    }
    .cta-button:hover {
      background-color: #660000;
    }
    .secondary-button {
      display: inline-block;
      background-color: #6c757d;
      color: #ffffff !important;
      padding: 14px 28px;
      text-decoration: none;
      font-weight: 500;
      font-size: 14px;
      letter-spacing: 0.5px;
      border-radius: 4px;
    }
    .secondary-button:hover {
      background-color: #545b62;
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
      .action-buttons {
        text-align: center;
      }
      .cta-button, .secondary-button {
        display: block;
        margin: 10px auto;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">MyUNI - ${isTurkish ? 'Yorum Bildirimi' : 'Comment Notification'}</div>
    </div>
    
    <div class="content">
      <h2 style="color: #990000; margin-bottom: 20px;">
        ${isTurkish ? 'Yeni Yorum Bildirimi' : 'New Comment Notification'}
      </h2>
      
      ${lowRatingWarning}
      ${helpFormLink}
      
      <div class="comment-section">
        <div class="comment-header">
          <div class="commenter-name">${commentData.name}</div>
          <div class="rating">${'⭐'.repeat(commentData.rating)} (${ratingText})</div>
        </div>
        <div class="comment-text">
          "${commentData.comment}"
        </div>
      </div>
      
      <div class="course-info">
        <div class="course-title">${isTurkish ? `${contentTypeText} Bilgileri` : `${contentTypeText} Information`}</div>
        <div style="margin-bottom: 10px;"><strong>${isTurkish ? `${contentTypeText}:` : `${contentTypeText}:`}</strong> ${contentInfo.title}</div>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://myunilab.net'}/${locale}/${isEvent ? (locale === 'tr' ? 'etkinlik' : 'event') : 'kurs'}/${contentInfo.slug}" class="course-link">
          ${isTurkish ? `${contentTypeText}i Görüntüle` : `View ${contentTypeText}`}
        </a>
      </div>
      
      <div class="details-section">
        <div class="detail-row">
          <div class="detail-label">${isTurkish ? 'Yorumcu:' : 'Commenter:'}</div>
          <div class="detail-value">${commentData.name}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">${isTurkish ? 'E-posta:' : 'Email:'}</div>
          <div class="detail-value">${commentData.email}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">${isTurkish ? 'Puan:' : 'Rating:'}</div>
          <div class="detail-value">${commentData.rating}/5 ⭐</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">${isTurkish ? 'Tarih:' : 'Date:'}</div>
          <div class="detail-value">${new Date().toLocaleDateString(isTurkish ? 'tr-TR' : 'en-US')}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">${isTurkish ? 'IP Adresi:' : 'IP Address:'}</div>
          <div class="detail-value">${commentData.ipAddress || 'N/A'}</div>
        </div>
      </div>
      
      <div class="action-buttons">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://myunilab.net'}/${locale}/${isEvent ? (locale === 'tr' ? 'etkinlik' : 'event') : 'kurs'}/${contentInfo.slug}" class="cta-button">
          ${isTurkish ? `${contentTypeText}i Görüntüle` : `View ${contentTypeText}`}
        </a>
        <a href="mailto:${commentData.email}" class="secondary-button">
          ${isTurkish ? 'Yanıtla' : 'Reply'}
        </a>
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
${isTurkish ? 'YENİ YORUM BİLDİRİMİ' : 'NEW COMMENT NOTIFICATION'}

${isLowRating ? `⚠️ ${isTurkish ? 'DÜŞÜK PUAN UYARISI' : 'LOW RATING ALERT'}: ${isTurkish ? 'Bu yorum 3 puandan düşük' : 'This comment has a rating below 3'}` : ''}

${isTurkish ? 'Yorumcu' : 'Commenter'}: ${commentData.name}
${isTurkish ? 'E-posta' : 'Email'}: ${commentData.email}
${isTurkish ? 'Puan' : 'Rating'}: ${commentData.rating}/5 ⭐
${isTurkish ? 'Tarih' : 'Date'}: ${new Date().toLocaleDateString(isTurkish ? 'tr-TR' : 'en-US')}

${isTurkish ? contentTypeText : contentTypeText}: ${contentInfo.title}
${isTurkish ? `${contentTypeText} Linki` : `${contentTypeText} Link`}: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://myunilab.net'}/${locale}/${isEvent ? (locale === 'tr' ? 'etkinlik' : 'event') : 'kurs'}/${contentInfo.slug}

${isTurkish ? 'Yorum' : 'Comment'}:
"${commentData.comment}"

${isTurkish ? `${contentTypeText}i görüntülemek için` : `To view the ${contentType.toLowerCase()}`}: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://myunilab.net'}/${locale}/${isEvent ? (locale === 'tr' ? 'etkinlik' : 'event') : 'kurs'}/${contentInfo.slug}

${isTurkish ? 'Yanıtlamak için' : 'To reply'}: ${commentData.email}

© 2025 MyUNI
`;

    const mailOptions = {
      from: {
        name: 'MyUNI - Comment System',
        address: process.env.EMAIL_USER
      },
      to: process.env.ADMIN_EMAIL || 'info@myunilab.net',
      subject: subject,
      html: htmlContent,
      text: textContent,
      bcc: process.env.NOTIFICATION_EMAILS ? process.env.NOTIFICATION_EMAILS.split(',') : []
    };
    
    console.log('Sending admin notification email...');
    const result = await transporter.sendMail(mailOptions);
    console.log('Admin notification email sent successfully! Message ID:', result.messageId);
    
    return {
      success: true,
      messageId: result.messageId
    };
    
  } catch (error) {
    console.error('Admin notification email error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send thank you email to commenter
const sendThankYouEmailToCommenter = async (commentData, contentInfo, locale = 'tr', contentType = 'course') => {
  try {
    console.log('Starting thank you email to commenter...');
    
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
    const isLowRating = commentData.rating < 3;
    const isEvent = contentType === 'event';
    
    const contentTypeText = isEvent 
      ? (isTurkish ? 'Etkinlik' : 'Event')
      : (isTurkish ? 'Kurs' : 'Course');
    
    const subject = isTurkish 
      ? `Yorumunuz için teşekkürler - ${contentInfo.title}`
      : `Thank you for your comment - ${contentInfo.title}`;
    
    const thankYouMessage = isTurkish
      ? 'Yorumunuz için çok teşekkür ederiz!'
      : 'Thank you very much for your comment!';
    
    const helpFormSection = isLowRating ? `
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; margin: 25px 0; border-radius: 8px; border-left: 4px solid #f39c12;">
        <h3 style="color: #856404; margin-bottom: 15px;">${isTurkish ? '💡 Size Nasıl Yardımcı Olabiliriz?' : '💡 How Can We Help You?'}</h3>
        <p style="color: #856404; margin-bottom: 15px;">
          ${isTurkish 
            ? 'Görüşünüzü bizimle paylaştığınız için teşekkür ederiz. Sizden gelecek her öneri, sonraki eğitimleri daha iyi hale getirmemize yardımcı olacaktır. Eğitimimizi daha faydalı kılmak için önerilerinizi duymaktan memnuniyet duyarız.'
            : 'Thank you for sharing your feedback with us. Every suggestion you provide will help us make future trainings better. We would be happy to hear your suggestions to make our training more beneficial.'
          }
        </p>
        <div style="text-align: left; margin-top: 20px;">
          <a href="https://myunilab.net/tr/iletisim" 
             style="display: inline-block; background-color: #f39c12; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: 500;">
            ${isTurkish ? 'Yardım Formu' : 'Help Form'}
          </a>
        </div>
      </div>
    ` : '';
    
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
      font-size: 18px;
      margin-bottom: 20px;
      color: #000000;
    }
    .message {
      font-size: 16px;
      margin-bottom: 30px;
      color: #000000;
      line-height: 1.6;
    }
    .highlight {
      color: #990000;
      font-weight: 500;
    }
    .course-info {
      background-color: #f8f9fa;
      padding: 25px;
      margin: 25px 0;
      border-radius: 8px;
      border-left: 4px solid #990000;
    }
    .course-title {
      font-size: 18px;
      font-weight: 600;
      color: #000000;
      margin-bottom: 10px;
    }
    .rating-display {
      font-size: 16px;
      color: #f39c12;
      margin: 10px 0;
    }
    .comment-preview {
      background-color: #ffffff;
      padding: 15px;
      margin: 15px 0;
      border-radius: 5px;
      border: 1px solid #e0e0e0;
      font-style: italic;
      color: #666666;
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
      border-radius: 4px;
    }
    .cta-button:hover {
      background-color: #660000;
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
    @media (max-width: 600px) {
      body {
        padding: 10px;
      }
      .header, .content {
        padding: 20px;
      }
      .button-section {
        text-align: center;
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
        ${isTurkish ? `Merhaba ${commentData.name}` : `Hello ${commentData.name}`},
      </div>
      
      <div class="message">
        <span class="highlight">${thankYouMessage}</span><br>
        ${isTurkish 
          ? 'Görüşlerinizi bizimle paylaştığınız için çok değerli. Yorumunuz diğer öğrenciler için de faydalı olacak.'
          : 'Your feedback is very valuable to us. Your comment will be helpful for other students as well.'
        }
      </div>
      
      <div class="course-info">
        <div class="course-title">${contentInfo.title}</div>
        <div class="rating-display">${'⭐'.repeat(commentData.rating)} (${commentData.rating}/5)</div>
        <div class="comment-preview">
          "${commentData.comment}"
        </div>
      </div>
      
      ${helpFormSection}
      
      <div class="message">
        ${isTurkish 
          ? 'Eğitim yolculuğunuzda başarılar dileriz!'
          : 'We wish you success in your learning journey!'
        }
      </div>
      
      <div class="button-section">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://myunilab.net'}/${locale}/${isEvent ? (locale === 'tr' ? 'etkinlik' : 'event') : 'kurs'}/${contentInfo.slug}" class="cta-button">
          ${isTurkish ? `${contentTypeText}i Görüntüle` : `View ${contentTypeText}`}
        </a>
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
${isTurkish ? `Merhaba ${commentData.name}` : `Hello ${commentData.name}`},

${thankYouMessage}

${isTurkish 
  ? 'Görüşlerinizi bizimle paylaştığınız için çok değerli. Yorumunuz diğer öğrenciler için de faydalı olacak.'
  : 'Your feedback is very valuable to us. Your comment will be helpful for other students as well.'
}

--- ${isTurkish ? 'YORUM DETAYLARI' : 'COMMENT DETAILS'} ---
${isTurkish ? contentTypeText : contentTypeText}: ${contentInfo.title}
${isTurkish ? 'Puan' : 'Rating'}: ${commentData.rating}/5 ⭐
${isTurkish ? 'Yorum' : 'Comment'}: "${commentData.comment}"

${isLowRating ? `
${isTurkish ? '💡 Size Nasıl Yardımcı Olabiliriz?' : '💡 How Can We Help You?'}
${isTurkish 
  ? 'Görüşünüzü bizimle paylaştığınız için teşekkür ederiz. Sizden gelecek her öneri, sonraki eğitimleri daha iyi hale getirmemize yardımcı olacaktır. Eğitimimizi daha faydalı kılmak için önerilerinizi duymaktan memnuniyet duyarız.'
  : 'Thank you for sharing your feedback with us. Every suggestion you provide will help us make future trainings better. We would be happy to hear your suggestions to make our training more beneficial.'
}
${isTurkish ? 'Yardım Formu' : 'Help Form'}: https://myunilab.net/tr/iletisim
` : ''}

${isTurkish ? `${contentTypeText}i görüntülemek için` : `To view the ${contentType.toLowerCase()}`}: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://myunilab.net'}/${locale}/${isEvent ? (locale === 'tr' ? 'etkinlik' : 'event') : 'kurs'}/${contentInfo.slug}

${isTurkish 
  ? 'Eğitim yolculuğunuzda başarılar dileriz!'
  : 'We wish you success in your learning journey!'
}

MyUNI Ekibi
© 2025 MyUNI
`;

    const mailOptions = {
      from: {
        name: 'MyUNI',
        address: process.env.EMAIL_USER
      },
      to: commentData.email,
      subject: subject,
      html: htmlContent,
      text: textContent
    };
    
    console.log('Sending thank you email to commenter...');
    const result = await transporter.sendMail(mailOptions);
    console.log('Thank you email sent successfully! Message ID:', result.messageId);
    
    return {
      success: true,
      messageId: result.messageId
    };
    
  } catch (error) {
    console.error('Thank you email error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Main function to send both notifications
const sendCommentNotifications = async (commentData, contentInfo, locale = 'tr', contentType = 'course') => {
  try {
    console.log('Starting comment notification process...');
    
    // Send admin notification
    const adminResult = await sendCommentNotificationToAdmin(commentData, contentInfo, locale, contentType);
    
    // Send thank you email to commenter
    const thankYouResult = await sendThankYouEmailToCommenter(commentData, contentInfo, locale, contentType);
    
    return {
      success: true,
      adminNotification: adminResult,
      thankYouEmail: thankYouResult
    };
    
  } catch (error) {
    console.error('Comment notification process error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Test function for comment notifications
const testCommentNotification = async (testEmail = 'test@example.com') => {
  const testCommentData = {
    name: 'Test Kullanıcı',
    email: testEmail,
    comment: 'Bu bir test yorumudur.',
    rating: 2, // Low rating to test help form
    ipAddress: '127.0.0.1'
  };

  const testCourseInfo = {
    title: 'Test Kursu',
    slug: 'test-kursu'
  };

  console.log('Testing comment notification...');
  const startTime = Date.now();
  
  try {
    const result = await sendCommentNotifications(testCommentData, testCourseInfo, 'tr');
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`Comment notification test completed in ${duration}ms`);
    console.log('Result:', result);
    
    return result;
  } catch (error) {
    console.error('Comment notification test failed:', error);
    return { success: false, error: error.message };
  }
};

export {
  sendCommentNotificationToAdmin,
  sendThankYouEmailToCommenter,
  sendCommentNotifications,
  testCommentNotification
};
