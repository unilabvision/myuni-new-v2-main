import 'server-only';
import { supabaseAdmin as supabase } from './supabaseAdmin';
import {
  enrollUserInPackage,
  enrollUserInTier,
} from './enrollmentService';

export type DeliverableItem = {
  id: string;
  type?: string;
  title?: string;
  courseId?: string;
  tierId?: string;
  paidPrice?: number;
  price?: number;
  listPrice?: number;
};

export type DeliveryResult = {
  success: boolean;
  firstEnrollmentId?: string;
  deliveredTitles: string[];
  errors: string[];
};

function resolveUserId(order: any): string | null {
  const fromCustom = order?.custom_data?.userId;
  if (typeof fromCustom === 'string' && fromCustom.startsWith('user_')) {
    return fromCustom;
  }
  // Never fall back to email for enrollment rows — My Courses queries by Clerk user_id
  if (typeof order?.user_id === 'string' && order.user_id.startsWith('user_')) {
    return order.user_id;
  }
  return typeof fromCustom === 'string' && fromCustom.length > 0 ? fromCustom : null;
}

async function ensureCourseEnrollment(
  userId: string,
  courseId: string
): Promise<{ id?: string; error?: string }> {
  const { data: existing, error: lookupError } = await supabase
    .from('myuni_enrollments')
    .select('id, is_active')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (lookupError) {
    return { error: `course lookup ${courseId}: ${lookupError.message}` };
  }

  if (existing) {
    if (!existing.is_active) {
      const { error } = await supabase
        .from('myuni_enrollments')
        .update({
          is_active: true,
          enrolled_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      if (error) return { error: `course activate ${courseId}: ${error.message}` };
    }
    return { id: existing.id };
  }

  const { data: created, error } = await supabase
    .from('myuni_enrollments')
    .insert({
      user_id: userId,
      course_id: courseId,
      enrolled_at: new Date().toISOString(),
      progress_percentage: 0,
      is_active: true,
      welcome_shown: false,
    })
    .select('id')
    .single();

  if (error) return { error: `course insert ${courseId}: ${error.message}` };
  return { id: created?.id };
}

async function ensureProductPurchase(
  userId: string,
  productId: string,
  pricePaid: number
): Promise<{ id?: string; error?: string }> {
  const { data: existing, error: lookupError } = await supabase
    .from('myuni_products_purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  if (lookupError) {
    return { error: `product lookup ${productId}: ${lookupError.message}` };
  }
  if (existing) return { id: existing.id };

  const { data: created, error } = await supabase
    .from('myuni_products_purchases')
    .insert({
      user_id: userId,
      product_id: productId,
      purchased_at: new Date().toISOString(),
      price_paid: pricePaid,
    })
    .select('id')
    .single();

  if (error) return { error: `product insert ${productId}: ${error.message}` };
  return { id: created?.id };
}

/**
 * Idempotent delivery for one cart/line item (course, package, product, tier).
 */
export async function deliverItem(
  userId: string,
  item: DeliverableItem,
  orderId?: string,
  pricePaid = 0
): Promise<{ id?: string; error?: string }> {
  const type = item.type || 'course';

  if (type === 'product') {
    return ensureProductPurchase(userId, item.id, pricePaid);
  }

  if (type === 'package') {
    const ok = await enrollUserInPackage(userId, item.id, orderId);
    if (!ok) return { error: `package enroll failed: ${item.id}` };
    return { id: orderId };
  }

  if (type === 'tier') {
    const courseId = item.courseId;
    const tierId = item.tierId;
    if (!courseId || !tierId) {
      return { error: `tier missing courseId/tierId for ${item.id}` };
    }
    const result = await enrollUserInTier(userId, courseId, tierId);
    if (!result.success) return { error: `tier enroll failed: ${item.id}` };
    return { id: result.enrollmentId };
  }

  // course (default)
  return ensureCourseEnrollment(userId, item.id);
}

/**
 * Deliver all access for a paid order. Safe to call multiple times.
 */
export async function deliverOrderAccess(
  order: any,
  priceByItemId?: Map<string, number>
): Promise<DeliveryResult> {
  const errors: string[] = [];
  const deliveredTitles: string[] = [];
  let firstEnrollmentId: string | undefined;

  const userId = resolveUserId(order);
  if (!userId) {
    return {
      success: false,
      deliveredTitles: [],
      errors: ['Missing Clerk userId on order (custom_data.userId)'],
    };
  }

  const isCartMode = order.custom_data?.cartMode === true;
  const cartItems: DeliverableItem[] = order.custom_data?.cartItems || [];

  const items: DeliverableItem[] =
    isCartMode && cartItems.length > 0
      ? cartItems
      : [
          {
            id: order.courseid,
            title: order.coursename,
            type: order.custom_data?.itemType || 'course',
            courseId: order.courseid,
            tierId: order.custom_data?.tierId,
          },
        ];

  for (const item of items) {
    if (!item?.id && item.type !== 'tier') {
      errors.push('Cart item missing id');
      continue;
    }

    const paid =
      priceByItemId?.get(item.id) ??
      item.paidPrice ??
      item.price ??
      0;

    const result = await deliverItem(userId, item, order.orderid, Number(paid) || 0);
    if (result.error) {
      errors.push(result.error);
      console.error('Order delivery item failed:', order.orderid, result.error);
    } else {
      if (result.id && !firstEnrollmentId) firstEnrollmentId = result.id;
      deliveredTitles.push(item.title || item.id);
    }
  }

  return {
    success: errors.length === 0,
    firstEnrollmentId,
    deliveredTitles,
    errors,
  };
}

/**
 * Returns true if order appears to have all expected course/product access.
 * Used by callback retries for completed-but-missing-enrollment cases.
 */
export async function orderNeedsDelivery(order: any): Promise<boolean> {
  if (order?.enrolled === false || order?.enrolled == null) {
    // Still check — enrolled flag can be wrong
  }

  const userId = resolveUserId(order);
  if (!userId) return true;

  const isCartMode = order.custom_data?.cartMode === true;
  const cartItems: DeliverableItem[] = order.custom_data?.cartItems || [];
  const items: DeliverableItem[] =
    isCartMode && cartItems.length > 0
      ? cartItems
      : [
          {
            id: order.courseid,
            type: order.custom_data?.itemType || 'course',
            courseId: order.courseid,
            tierId: order.custom_data?.tierId,
          },
        ];

  for (const item of items) {
    const type = item.type || 'course';

    if (type === 'product') {
      const { data } = await supabase
        .from('myuni_products_purchases')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', item.id)
        .maybeSingle();
      if (!data) return true;
      continue;
    }

    if (type === 'package') {
      const { data: pkg } = await supabase
        .from('myuni_package_enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('package_id', item.id)
        .eq('is_active', true)
        .maybeSingle();
      if (!pkg) return true;

      const { data: packageCourses } = await supabase
        .from('myuni_package_courses')
        .select('course_id')
        .eq('package_id', item.id);
      for (const pc of packageCourses || []) {
        const { data: enr } = await supabase
          .from('myuni_enrollments')
          .select('id')
          .eq('user_id', userId)
          .eq('course_id', pc.course_id)
          .eq('is_active', true)
          .maybeSingle();
        if (!enr) return true;
      }
      continue;
    }

    if (type === 'tier') {
      if (!item.courseId || !item.tierId) return true;
      const { data } = await supabase
        .from('myuni_enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', item.courseId)
        .eq('tier_id', item.tierId)
        .eq('is_active', true)
        .maybeSingle();
      if (!data) return true;
      continue;
    }

    const { data } = await supabase
      .from('myuni_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', item.id)
      .eq('is_active', true)
      .maybeSingle();
    if (!data) return true;
  }

  return false;
}
