import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import {
  resolveCoursePaymentApplications,
  type CoursePaymentItem,
} from '@/lib/siteApplications/coursePaymentApplications';

const MAX_CART_ITEMS = 50;

function buildCartApplicationUrl(params: {
  locale: string;
  courseId: string;
  courseSlug: string;
  itemIds: string[];
}): string {
  const segment = params.locale === 'en' ? 'course' : 'kurs';
  const action = params.locale === 'en' ? 'application' : 'basvuru';
  const query = new URLSearchParams({
    id: params.courseId,
    cartIds: params.itemIds.join(','),
    mode: 'cart',
  });
  return `/${params.locale}/${segment}/${params.courseSlug}/${action}?${query.toString()}`;
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0 || items.length > MAX_CART_ITEMS) {
      return NextResponse.json({ error: 'Invalid cart items' }, { status: 400 });
    }

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return NextResponse.json({ error: 'User email not found' }, { status: 422 });

    const normalizedItems: CoursePaymentItem[] = items.map((item: CoursePaymentItem) => ({
      id: String(item.id || ''),
      type: String(item.type || ''),
      slug: String(item.slug || ''),
      courseId: item.courseId ? String(item.courseId) : undefined,
      title: item.title ? String(item.title) : undefined,
    }));
    const resolution = await resolveCoursePaymentApplications({
      items: normalizedItems,
      email,
    });

    if (!resolution.missing) {
      return NextResponse.json({ applicationRequired: false });
    }

    return NextResponse.json({
      applicationRequired: true,
      applicationUrl: buildCartApplicationUrl({
        locale: body.locale === 'en' ? 'en' : 'tr',
        courseId: resolution.missing.courseId,
        courseSlug: resolution.missing.courseSlug,
        itemIds: normalizedItems.map((item) => item.id),
      }),
    });
  } catch (error) {
    console.error('Payment application preflight failed:', error);
    return NextResponse.json({ error: 'Application check failed' }, { status: 503 });
  }
}
