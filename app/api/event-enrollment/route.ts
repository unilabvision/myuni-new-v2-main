// app/api/event-enrollment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, locale = 'tr', userEmail, userName } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const { data: existingEnrollment, error: checkError } = await supabaseAdmin
      .from('myuni_event_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .maybeSingle();

    if (checkError && (checkError as { code?: string }).code !== 'PGRST116') {
      console.error('Error checking existing enrollment:', checkError);
      return NextResponse.json({ error: 'Failed to check enrollment status' }, { status: 500 });
    }

    if (existingEnrollment) {
      return NextResponse.json({ error: 'User is already enrolled in this event' }, { status: 400 });
    }

    const { data: event, error: eventError } = await supabaseAdmin
      .from('myuni_events')
      .select('*')
      .eq('id', eventId)
      .eq('is_active', true)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found or inactive' }, { status: 404 });
    }

    if (!event.is_registration_open) {
      return NextResponse.json({ error: 'Registration is closed for this event' }, { status: 400 });
    }

    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      return NextResponse.json({ error: 'Registration deadline has passed' }, { status: 400 });
    }

    const { count: currentCount, error: countError } = await supabaseAdmin
      .from('myuni_event_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    if (countError) {
      return NextResponse.json({ error: 'Failed to check event capacity' }, { status: 500 });
    }

    if (event.max_attendees && (currentCount || 0) >= event.max_attendees) {
      return NextResponse.json({ error: 'Event is full' }, { status: 400 });
    }

    const clerkUser = await currentUser();
    let userProfile = {
      full_name:
        userName ||
        [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') ||
        'Kullanıcı',
      email:
        userEmail ||
        clerkUser?.emailAddresses?.[0]?.emailAddress ||
        clerkUser?.primaryEmailAddress?.emailAddress ||
        '',
    };

    if (!userProfile.email) {
      const { data: profileData } = await supabaseAdmin
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', userId)
        .maybeSingle();
      if (profileData?.email) {
        userProfile = {
          full_name: profileData.full_name || userProfile.full_name,
          email: profileData.email,
        };
      }
    }

    const { data: enrollment, error: enrollError } = await supabaseAdmin
      .from('myuni_event_enrollments')
      .insert([
        {
          user_id: userId,
          event_id: eventId,
          attendance_status: 'registered',
          notes: `Registered via API on ${new Date().toISOString()}`,
        },
      ])
      .select()
      .single();

    if (enrollError) {
      console.error('Error creating enrollment:', enrollError);
      return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 });
    }

    if (userProfile.email && userProfile.email !== 'user@example.com') {
      try {
        const emailService = await import(
          '../../email_enrolment_services/eventEnrollmentEmailService.js'
        );
        await emailService.sendEventEnrollmentEmail(
          { name: userProfile.full_name, email: userProfile.email },
          {
            title: event.title,
            slug: event.slug,
            description: event.description,
            start_date: event.start_date,
            end_date: event.end_date,
            is_online: event.is_online,
            meeting_url: event.meeting_url,
            location_name: event.location_name,
            organizer_name: event.organizer_name,
          },
          { id: enrollment.id, enrolled_at: enrollment.enrolled_at },
          locale
        );
      } catch (emailError) {
        console.error('Error in email sending process:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully enrolled in event',
      enrollment,
    });
  } catch (error) {
    console.error('Error in event enrollment API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
