import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { OrderLineItem, OrderSnapshot } from '@/lib/orderSnapshot';

type OrderRow = {
  orderid: string;
  coursename: string | null;
  amount: number | string | null;
  status: string | null;
  paymentmethod: string | null;
  discountcode: string | null;
  discountamount: number | string | null;
  created_at: string | null;
  updated_at: string | null;
  useremail: string | null;
  custom_data: Record<string, unknown> | null;
};

function roundMoney(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function escapeFilterValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function collectUserEmails(user: Awaited<ReturnType<typeof currentUser>>): string[] {
  if (!user) return [];
  const emails = new Set<string>();
  for (const entry of user.emailAddresses || []) {
    const email = entry?.emailAddress?.trim();
    if (email) emails.add(email.toLowerCase());
  }
  const primary = user.primaryEmailAddress?.emailAddress?.trim();
  if (primary) emails.add(primary.toLowerCase());
  return Array.from(emails);
}

function belongsToUser(order: OrderRow, userId: string, emails: string[]): boolean {
  const custom = (order.custom_data || {}) as Record<string, unknown>;
  if (custom.userId === userId || custom.clerkUserId === userId) return true;
  const orderEmail = String(order.useremail || '').trim().toLowerCase();
  return Boolean(orderEmail && emails.includes(orderEmail));
}

function normalizeLineItem(raw: Record<string, unknown>): OrderLineItem {
  const listPrice = roundMoney(Number(raw.listPrice ?? raw.price) || 0);
  const paidRaw = raw.paidPrice != null ? Number(raw.paidPrice) : listPrice;
  return {
    id: String(raw.id || ''),
    title: String(raw.title || ''),
    type: String(raw.type || 'course'),
    slug: raw.slug ? String(raw.slug) : undefined,
    courseId: raw.courseId ? String(raw.courseId) : undefined,
    tierId: raw.tierId ? String(raw.tierId) : undefined,
    course_type: raw.course_type ? String(raw.course_type) : undefined,
    listPrice,
    paidPrice: roundMoney(Number.isFinite(paidRaw) ? paidRaw : 0),
  };
}

function normalizeSnapshot(order: OrderRow): OrderSnapshot {
  const custom = (order.custom_data || {}) as Record<string, unknown>;
  const snapshot = custom.orderSnapshot as Partial<OrderSnapshot> | null | undefined;

  if (snapshot && Array.isArray(snapshot.items) && snapshot.items.length > 0) {
    const items = snapshot.items
      .filter(Boolean)
      .map((item) => normalizeLineItem(item as unknown as Record<string, unknown>));
    const paidTotal = roundMoney(
      snapshot.paidTotal != null ? Number(snapshot.paidTotal) : Number(order.amount) || 0
    );
    const listTotal = roundMoney(
      snapshot.listTotal != null
        ? Number(snapshot.listTotal)
        : items.reduce((sum, item) => sum + item.listPrice, 0)
    );
    const discountAmount = roundMoney(
      snapshot.discountAmount != null
        ? Number(snapshot.discountAmount)
        : Number(order.discountamount) || Math.max(0, listTotal - paidTotal)
    );
    const discountCodes = String(
      snapshot.discountCodes || order.discountcode || custom.discountCodes || ''
    ).trim();

    return { items, listTotal, discountAmount, paidTotal, discountCodes };
  }

  const paidTotal = roundMoney(Number(order.amount) || 0);
  const discountAmount = roundMoney(Number(order.discountamount) || 0);
  const listTotal = roundMoney(
    custom.listTotal != null ? Number(custom.listTotal) : paidTotal + discountAmount
  );
  const title = String(order.coursename || 'Sipariş').trim() || 'Sipariş';
  const itemType = String(custom.itemType || 'course');

  return {
    items: [
      {
        id: String(custom.courseId || order.orderid),
        title,
        type: itemType,
        slug: custom.slug ? String(custom.slug) : undefined,
        courseId: custom.courseId ? String(custom.courseId) : undefined,
        tierId: custom.tierId ? String(custom.tierId) : undefined,
        course_type: custom.courseType ? String(custom.courseType) : undefined,
        listPrice: listTotal > 0 ? listTotal : paidTotal,
        paidPrice: paidTotal,
      },
    ],
    listTotal: listTotal > 0 ? listTotal : paidTotal,
    discountAmount,
    paidTotal,
    discountCodes: String(order.discountcode || custom.discountCodes || '').trim(),
  };
}

/**
 * GET /api/orders/me
 * Authenticated user's completed orders (snapshot-normalized).
 * Query: ?limit=20&offset=0&includeFailed=1
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    const emails = collectUserEmails(user);

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 20));
    const offset = Math.max(0, Number(searchParams.get('offset')) || 0);
    const includeFailed = searchParams.get('includeFailed') === '1';

    const orParts = [
      `custom_data->>userId.eq.${userId}`,
      `custom_data->>clerkUserId.eq.${userId}`,
      ...emails.map((email) => `useremail.eq."${escapeFilterValue(email)}"`),
    ];

    let query = supabaseAdmin
      .from('orders')
      .select(
        'orderid, coursename, amount, status, paymentmethod, discountcode, discountamount, created_at, updated_at, useremail, custom_data',
        { count: 'exact' }
      )
      .or(orParts.join(','));

    if (includeFailed) {
      query = query.in('status', ['completed', 'failed', 'pending']);
    } else {
      query = query.eq('status', 'completed');
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('GET /api/orders/me error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const owned = ((data || []) as unknown as OrderRow[]).filter((order) =>
      belongsToUser(order, userId, emails)
    );

    const orders = owned.map((order) => {
      const snapshot = normalizeSnapshot(order);
      return {
        orderId: order.orderid,
        status: order.status || 'completed',
        paymentMethod: order.paymentmethod || 'iyzico',
        discountCode: order.discountcode || snapshot.discountCodes || '',
        discountAmount: roundMoney(Number(order.discountamount) || snapshot.discountAmount),
        amount: roundMoney(Number(order.amount) || snapshot.paidTotal),
        courseName: order.coursename,
        createdAt: order.created_at || order.updated_at,
        updatedAt: order.updated_at,
        snapshot,
      };
    });

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        limit,
        offset,
        total: count ?? orders.length,
      },
    });
  } catch (error) {
    console.error('GET /api/orders/me unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
