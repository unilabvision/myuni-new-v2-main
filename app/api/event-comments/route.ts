import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { supabase } from '../../../lib/supabase';
import { sendCommentNotifications } from '../../_services/commentNotificationService';

function toInitials(firstName?: string | null, lastName?: string | null): string {
  const f = firstName?.trim() || '';
  const l = lastName?.trim() || '';

  return `${f.charAt(0).toUpperCase()}. ${l.charAt(0).toUpperCase()}.`;
}

function toFullName(firstName?: string | null, lastName?: string | null): string {
  const f = firstName?.trim() || '';
  const l = lastName?.trim() || '';
  
  return `${f} ${l}`.trim() || 'Kullanıcı';
}

// GET: list comments by eventId or get average rating
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');
  const action = searchParams.get('action');
  
  if (!eventId) {
    return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
  }

  try {
    // If action is 'rating', return average rating
    if (action === 'rating') {
      const { data, error } = await supabase
        .from('myuni_event_comments')
        .select('rating')
        .eq('event_id', eventId)
        .eq('status', 'approved')
        .not('rating', 'is', null);

      if (error) throw error;

      if (!data || data.length === 0) {
        return NextResponse.json({ averageRating: null, totalRatings: 0 });
      }

      const totalRatings = data.length;
      const sumRatings = data.reduce((sum, comment) => sum + (comment.rating || 0), 0);
      const averageRating = Math.round((sumRatings / totalRatings) * 10) / 10; // Round to 1 decimal place

      return NextResponse.json({ 
        averageRating, 
        totalRatings 
      });
    }

    // Default: return comments
    const { data, error } = await supabase
      .from('myuni_event_comments')
      .select('*')
      .eq('event_id', eventId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ comments: data });
  } catch (err) {
    console.error('GET /event-comments error', err);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST: create a comment if user enrolled to this event
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { eventId, content, rating, isAnonymous } = body as { eventId?: string; content?: string; rating?: number; isAnonymous?: boolean };

    if (!eventId || !content || content.trim().length < 3) {
      return NextResponse.json({ error: 'eventId and content are required' }, { status: 400 });
    }

    // Check enrollment: user must have enrollment for this event
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('myuni_event_enrollments')
      .select('id, attendance_status')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .maybeSingle();

    if (enrollmentError) {
      console.error('Enrollment check error', enrollmentError);
      return NextResponse.json({ error: 'Enrollment check failed' }, { status: 500 });
    }

    if (!enrollment) {
      return NextResponse.json({ error: 'Yorum yapmak için etkinliğe kayıtlı olmalısınız' }, { status: 403 });
    }

    // Check if attendance status is valid for commenting (registered, attended, etc.)
    const validStatuses = ['registered', 'attended', 'completed'];
    if (!validStatuses.includes(enrollment.attendance_status)) {
      return NextResponse.json({ error: 'Yorum yapmak için etkinliğe kayıtlı olmalısınız' }, { status: 403 });
    }

    const displayName = isAnonymous ? toInitials(user.firstName, user.lastName) : toFullName(user.firstName, user.lastName);

    const { data, error } = await supabase
      .from('myuni_event_comments')
      .insert([
        {
          event_id: eventId,
          user_id: userId,
          user_display_name: displayName,
          content: content.trim(),
          rating: typeof rating === 'number' ? Math.max(1, Math.min(5, Math.round(rating))) : null,
          status: 'approved',
          is_anonymous: isAnonymous || false
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Send comment notifications (admin notification + thank you email)
    try {
      // Get event information for email
      const { data: eventData, error: eventError } = await supabase
        .from('myuni_events')
        .select('title, slug')
        .eq('id', eventId)
        .single();

      if (!eventError && eventData) {
        const commentData = {
          name: displayName,
          email: user.emailAddresses[0]?.emailAddress || '',
          comment: content.trim(),
          rating: typeof rating === 'number' ? Math.max(1, Math.min(5, Math.round(rating))) : null,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
        };

        const eventInfo = {
          title: eventData.title,
          slug: eventData.slug
        };

        // Default to Turkish locale
        const locale = 'tr';

        // Send notifications synchronously (immediate sending)
        try {
          await sendCommentNotifications(commentData, eventInfo, locale, 'event');
          console.log('Event comment notifications sent successfully');
        } catch (notificationError) {
          console.error('Event comment notification error:', notificationError);
          // Don't fail the comment creation if notification fails
        }
      }
    } catch (notificationError) {
      console.error('Event comment notification setup error:', notificationError);
      // Don't fail the comment creation if notification setup fails
    }

    return NextResponse.json({ comment: data }, { status: 201 });
  } catch (err) {
    console.error('POST /event-comments error', err);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

// PUT: update a comment (only by the comment owner)
export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { commentId, content, rating, isAnonymous } = body as { commentId?: string; content?: string; rating?: number; isAnonymous?: boolean };

    if (!commentId || !content || content.trim().length < 3) {
      return NextResponse.json({ error: 'commentId and content are required' }, { status: 400 });
    }

    // First, check if the comment exists and belongs to the user
    const { data: existingComment, error: fetchError } = await supabase
      .from('myuni_event_comments')
      .select('user_id, event_id')
      .eq('id', commentId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (existingComment.user_id !== userId) {
      return NextResponse.json({ error: 'Bu yorumu düzenleme yetkiniz yok' }, { status: 403 });
    }

    // Get user info for display name update
    const user = await currentUser();
    const displayName = isAnonymous ? (user ? toInitials(user.firstName, user.lastName) : 'K.K.') : (user ? toFullName(user.firstName, user.lastName) : 'Kullanıcı');

    // Update the comment
    const { data, error } = await supabase
      .from('myuni_event_comments')
      .update({
        content: content.trim(),
        rating: typeof rating === 'number' ? Math.max(1, Math.min(5, Math.round(rating))) : null,
        is_anonymous: isAnonymous || false,
        user_display_name: displayName
      })
      .eq('id', commentId)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

    return NextResponse.json({ comment: data });
  } catch (err) {
    console.error('PUT /event-comments error', err);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}

// DELETE: delete a comment (only by the comment owner)
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'commentId is required' }, { status: 400 });
    }

    // First, check if the comment exists and belongs to the user
    const { data: existingComment, error: fetchError } = await supabase
      .from('myuni_event_comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (existingComment.user_id !== userId) {
      return NextResponse.json({ error: 'Bu yorumu silme yetkiniz yok' }, { status: 403 });
    }

    // Delete the comment
    const { error } = await supabase
      .from('myuni_event_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /event-comments error', err);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
