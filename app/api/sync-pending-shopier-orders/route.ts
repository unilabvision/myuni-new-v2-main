// Shopier link: Sitede üye olmadan Shopier'dan satın alan kullanıcı, aynı e-posta ile kayıt olunca
// bu API çağrıldığında bekleyen siparişler kursa yazılır (dashboard yüklenirken bir kez çağrılır).

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { supabaseAdmin as supabase } from '../../../lib/supabaseAdmin';

async function enrollUserToCourse(userId: string, courseId: string) {
  const { data: existing } = await supabase
    .from('myuni_enrollments')
    .select('id, is_active')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();

  if (existing?.is_active) return { success: true, enrollmentId: existing.id };
  if (existing && !existing.is_active) {
    await supabase
      .from('myuni_enrollments')
      .update({ is_active: true, enrolled_at: new Date().toISOString(), progress_percentage: 0 })
      .eq('id', existing.id);
    return { success: true, enrollmentId: existing.id };
  }

  const { data: newEnrollment, error } = await supabase
    .from('myuni_enrollments')
    .insert({
      user_id: userId,
      course_id: courseId,
      enrolled_at: new Date().toISOString(),
      progress_percentage: 0,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, enrollmentId: newEnrollment.id };
}

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const primaryEmail = user?.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress;
    const email = primaryEmail?.toLowerCase?.() ?? null;
    if (!email) {
      return NextResponse.json({ success: false, message: 'No email' }, { status: 400 });
    }

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('orderid, courseid, enrollmentid, enrolled')
      .eq('useremail', email)
      .eq('status', 'completed')
      .eq('paymentmethod', 'shopier_link')
      .or('enrolled.is.null,enrolled.eq.false');

    if (ordersError || !orders?.length) {
      return NextResponse.json({ success: true, synced: 0 });
    }

    let synced = 0;
    for (const order of orders) {
      const result = await enrollUserToCourse(userId, order.courseid);
      if (result.success && result.enrollmentId) {
        await supabase
          .from('orders')
          .update({
            enrolled: true,
            enrollmentid: result.enrollmentId,
            updated_at: new Date().toISOString(),
          })
          .eq('orderid', order.orderid);
        synced++;
      }
    }

    return NextResponse.json({ success: true, synced });
  } catch (e) {
    console.error('[sync-pending-shopier-orders]', e);
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : 'Error' },
      { status: 500 }
    );
  }
}
