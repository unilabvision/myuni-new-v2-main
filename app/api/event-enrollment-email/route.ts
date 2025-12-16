// app/api/event-enrollment-email/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userInfo, eventInfo, enrollmentInfo, locale } = await request.json();

    // Validate required fields
    if (!userInfo?.email || !userInfo?.name || !eventInfo || !enrollmentInfo) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Import the email service here (server-side only)
    const emailService = await import('../../email_enrolment_services/eventEnrollmentEmailService.js');
    
    const result = await emailService.sendEventEnrollmentEmail(
      userInfo,
      eventInfo,
      enrollmentInfo,
      locale || 'tr'
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Event enrollment email API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
