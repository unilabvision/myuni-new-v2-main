// app/api/send-certificate-email/route.ts - Updated for both courses and events
import { NextResponse } from 'next/server';
import { sendPurchaseConfirmationEmail } from '../../_services/emailService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields - itemType added for course/event distinction
    const requiredFields = ['userEmail', 'userName', 'certificateNumber', 'itemType'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      return NextResponse.json({ 
        success: false, 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    const { 
      userEmail, 
      userName, 
      eventName,
      courseName, 
      certificateNumber, 
      certificateUrl, 
      locale = 'tr',
      itemType // 'course' or 'event'
    } = body;

    // Determine the item name based on type
    let itemName;
    if (itemType === 'event') {
      itemName = eventName;
      if (!eventName) {
        return NextResponse.json({ 
          success: false, 
          error: 'eventName is required for event certificates' 
        }, { status: 400 });
      }
    } else {
      itemName = courseName;
      if (!courseName) {
        return NextResponse.json({ 
          success: false, 
          error: 'courseName is required for course certificates' 
        }, { status: 400 });
      }
    }
    
    // Prepare email data
    const userInfo = {
      name: userName,
      email: userEmail
    };

    const courseInfo = {
      title: itemName,
      description: itemType === 'event' 
        ? 'Etkinlik sertifikanız başarıyla oluşturuldu ve hazır!'
        : 'Kurs sertifikanız başarıyla oluşturuldu ve hazır!',
      slug: 'certificate-completion'
    };

    const orderInfo = {
      orderId: certificateNumber,
      amount: 'Sertifika',
      isFree: true,
      certificateUrl: certificateUrl || `https://certificates.myunilab.net/${certificateNumber}`,
      isCertificateEmail: true,
      itemType: itemType // Pass item type to email service
    };

    console.log('📧 Sending certificate email via API...', {
      email: userEmail,
      itemName: itemName,
      itemType: itemType,
      certificateNumber: certificateNumber
    });

    // Send email
    const emailResult = await sendPurchaseConfirmationEmail(
      userInfo, 
      courseInfo, 
      orderInfo, 
      locale,
      'certificate'
    );

    if (emailResult.success) {
      console.log('✅ Certificate email sent successfully via API:', emailResult.messageId);
      
      return NextResponse.json({
        success: true,
        messageId: emailResult.messageId
      }, { status: 200 });
    } else {
      console.error('❌ Failed to send certificate email via API:', emailResult.error);
      
      return NextResponse.json({
        success: false,
        error: emailResult.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('💥 Certificate email API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: 'Failed to send certificate email: ' + errorMessage
    }, { status: 500 });
  }
}