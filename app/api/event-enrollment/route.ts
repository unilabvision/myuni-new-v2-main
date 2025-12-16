// app/api/event-enrollment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Request body:', body);
    
    const { userId, eventId, locale = 'tr', userEmail, userName } = body;

    if (!userId || !eventId) {
      console.error('Missing required fields:', { userId, eventId });
      return NextResponse.json(
        { error: 'User ID and Event ID are required' },
        { status: 400 }
      );
    }

    console.log('Processing event enrollment for:', { userId, eventId });

    // Check if user is already enrolled
    const { data: existingEnrollment, error: checkError } = await supabase
      .from('myuni_event_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single();

    if (checkError && (checkError as any).code !== 'PGRST116') {
      console.error('Error checking existing enrollment:', checkError);
      return NextResponse.json(
        { error: 'Failed to check enrollment status' },
        { status: 500 }
      );
    }

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'User is already enrolled in this event' },
        { status: 400 }
      );
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('myuni_events')
      .select('*')
      .eq('id', eventId)
      .eq('is_active', true)
      .single();

    if (eventError || !event) {
      console.error('Error fetching event:', eventError);
      return NextResponse.json(
        { error: 'Event not found or inactive' },
        { status: 404 }
      );
    }

    // Check if registration is open
    if (!event.is_registration_open) {
      return NextResponse.json(
        { error: 'Registration is closed for this event' },
        { status: 400 }
      );
    }

    // Check registration deadline
    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      return NextResponse.json(
        { error: 'Registration deadline has passed' },
        { status: 400 }
      );
    }

    // Get current attendee count
    const { count: currentCount, error: countError } = await supabase
      .from('myuni_event_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    if (countError) {
      console.error('Error counting attendees:', countError);
      return NextResponse.json(
        { error: 'Failed to check event capacity' },
        { status: 500 }
      );
    }

    // Check if event is full
    if (event.max_attendees && (currentCount || 0) >= event.max_attendees) {
      return NextResponse.json(
        { error: 'Event is full' },
        { status: 400 }
      );
    }

    // Use user profile from frontend or fetch from database
    let userProfile = null;
    
    console.log('Received user data:', { userEmail, userName });
    
    if (userEmail && userEmail !== '' && userEmail !== 'user@example.com') {
      // Use data from frontend
      userProfile = {
        full_name: userName || 'Kullanıcı',
        email: userEmail
      };
      console.log('✅ Using user profile from frontend:', userProfile);
    } else {
      // Fallback: try to fetch from database
      console.log('Fetching user profile from database for userId:', userId);
      
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', userId)
        .single();
      
             if (profileError) {
         console.log('user_profiles error:', profileError);
         
                // Try to get user email from Clerk users table or other sources
       try {
         // Since we're using Clerk, try to find user in a custom users table
         const { data: customUser, error: customError } = await supabase
           .from('users')
           .select('email, full_name')
           .eq('clerk_id', userId)
           .single();
         
         if (!customError && customUser) {
           userProfile = {
             full_name: customUser.full_name || customUser.email?.split('@')[0] || 'Kullanıcı',
             email: customUser.email
           };
           console.log('Found user in custom users table:', userProfile);
         } else {
           console.log('Custom users table error:', customError);
           
           // Try to get from auth.users table as fallback
           try {
             const { data: authUser, error: authError } = await supabase
               .from('auth.users')
               .select('email, raw_user_meta_data')
               .eq('id', userId)
               .single();
             
             if (!authError && authUser) {
               userProfile = {
                 full_name: authUser.raw_user_meta_data?.full_name || authUser.email?.split('@')[0] || 'Kullanıcı',
                 email: authUser.email
               };
               console.log('Found user in auth.users table:', userProfile);
             } else {
               console.log('auth.users error:', authError);
               
               // Use a default profile if all fails
               userProfile = {
                 full_name: 'Kullanıcı',
                 email: 'user@example.com'
               };
               console.log('Using default profile');
             }
           } catch (authTableError) {
             console.log('auth.users table access error:', authTableError);
             
             // Use a default profile if all fails
             userProfile = {
               full_name: 'Kullanıcı',
               email: 'user@example.com'
             };
             console.log('Using default profile');
           }
         }
       } catch (customTableError) {
         console.log('Custom users table access error:', customTableError);
         
         // Use a default profile if all fails
         userProfile = {
           full_name: 'Kullanıcı',
           email: 'user@example.com'
         };
         console.log('Using default profile');
       }
       } else {
        userProfile = profileData;
        console.log('Found user in user_profiles table:', userProfile);
      }
    }

    // Create enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from('myuni_event_enrollments')
      .insert([
        {
          user_id: userId,
          event_id: eventId,
          attendance_status: 'registered',
          notes: `Registered via API on ${new Date().toISOString()}`
        }
      ])
      .select()
      .single();

    if (enrollError) {
      console.error('Error creating enrollment:', enrollError);
      return NextResponse.json(
        { error: 'Failed to create enrollment' },
        { status: 500 }
      );
    }

    // Send confirmation email
    console.log('Starting email sending process...');
    
    // Final check for valid email
    if (!userProfile.email || userProfile.email === 'user@example.com') {
      console.error('❌ Invalid email address, skipping email sending');
    } else {
      try {
        const userInfo = {
          name: userProfile.full_name || 'Kullanıcı',
          email: userProfile.email
        };

      const eventInfo = {
        title: event.title,
        slug: event.slug,
        description: event.description,
        start_date: event.start_date,
        end_date: event.end_date,
        is_online: event.is_online,
        meeting_url: event.meeting_url,
        location_name: event.location_name,
        organizer_name: event.organizer_name
      };

      const enrollmentInfo = {
        id: enrollment.id,
        enrolled_at: enrollment.enrolled_at
      };

      console.log('Email data prepared:', { userInfo, eventInfo: event.title, enrollmentInfo: enrollment.id });
      
      // Import and use email service directly (server-side only)
      const emailService = await import('../../email_enrolment_services/eventEnrollmentEmailService.js');
      const emailResult = await emailService.sendEventEnrollmentEmail(userInfo, eventInfo, enrollmentInfo, locale);
      
      console.log('Email sending result:', emailResult);
      
      if (emailResult.success) {
        console.log('✅ Enrollment confirmation email sent successfully to:', userInfo.email);
      } else {
        console.error('❌ Failed to send enrollment confirmation email:', emailResult.error);
      }
      } catch (emailError) {
        console.error('💥 Error in email sending process:', emailError);
        console.error('Email error stack:', emailError instanceof Error ? emailError.stack : 'No stack trace');
        // Don't fail the enrollment if email fails
      }
    }

    const response = {
      success: true,
      message: 'Successfully enrolled in event',
      enrollment: enrollment
    };
    
    console.log('Enrollment successful, returning:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in event enrollment API:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}