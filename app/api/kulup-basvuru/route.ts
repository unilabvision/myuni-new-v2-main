import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import { sendClubApplicationConfirmationEmail, sendNewClubApplicationNotificationEmail } from '@/app/email_enrolment_services/kulupApplicationEmailService.js';
import {
  assertLegalConsent,
  buildLegalConsentSnapshot,
} from '@/lib/legalConsent';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting kulup-basvuru API...');
    
    const formData = await request.json();
    console.log('Received form data:', formData);
    
    // Validate required fields
    const requiredFields = [
      'clubName', 'university', 'foundingYear', 'clubType', 'memberCount',
      'representativeName', 'position', 'email', 'phone',
      'clubPurpose', 'eventTypes', 'recentProject', 'motivation', 'expectations', 'contributions'
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field] || formData[field].toString().trim() === '');
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        missingFields 
      }, { status: 400 });
    }

    const locale = formData.locale || 'tr';
    const consentError = assertLegalConsent(formData, locale);
    if (consentError) {
      return NextResponse.json({ error: consentError }, { status: 400 });
    }

    const legalConsent = buildLegalConsentSnapshot({
      source: 'kulup-basvuru',
      locale,
    });
    
    // Insert application data into database
    const { data, error } = await supabase
      .from('myuni_form_submissions')
      .insert([
        {
          form_config_id: '4f4db723-e5d9-46be-b8ac-a63f7bbb11c0', // kulup_form config ID
          submission_data: {
            ...formData,
            privacy_consent: true,
            terms_consent: true,
            ...legalConsent,
          },
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ])
      .select();
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Failed to save application',
        details: error.message 
      }, { status: 500 });
    }
    
    console.log('Application saved successfully:', data);
    
    // Send emails after successful database save
    try {
      console.log('📧 Sending club application emails...');
      console.log('📧 Form data for emails:', formData);
      
      // Extract club info for emails
      const clubInfo = {
        clubName: formData.clubName,
        university: formData.university,
        representativeName: formData.representativeName,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        clubType: formData.clubType,
        memberCount: formData.memberCount,
        foundingYear: formData.foundingYear,
        clubPurpose: formData.clubPurpose,
        eventTypes: formData.eventTypes,
        recentProject: formData.recentProject,
        motivation: formData.motivation,
        expectations: formData.expectations,
        contributions: formData.contributions
      };
      
      console.log('📧 Club info extracted:', clubInfo);
      
      // Send confirmation email to club
      console.log('📧 Sending confirmation email to club...');
      const confirmationResult = await sendClubApplicationConfirmationEmail(clubInfo, formData, 'tr');
      console.log('✅ Club confirmation email sent:', confirmationResult.messageId);
      
      // Send notification email to MyUNI team
      console.log('📧 Sending notification email to MyUNI team...');
      const notificationResult = await sendNewClubApplicationNotificationEmail(clubInfo, formData, 'tr');
      console.log('✅ MyUNI notification email sent:', notificationResult.messageId);
      
    } catch (emailError) {
      console.error('❌ Error sending emails:', emailError);
      console.error('❌ Email error details:', {
        message: emailError instanceof Error ? emailError.message : String(emailError),
        stack: emailError instanceof Error ? emailError.stack : undefined,
        name: emailError instanceof Error ? emailError.name : 'Unknown'
      });
      // Don't fail the entire request if email fails
      console.log('⚠️ Continuing despite email error...');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      submissionId: data[0]?.id
    });
    
  } catch (error) {
    console.error('Error in kulup-basvuru API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
