import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { resolveDiscountRestrictions } from '@/lib/discountRestrictions';

type ValidateBody = {
  code?: string;
  courseId?: string | null;
  itemType?: string | null;
  isFullCourse?: boolean;
  coursePrice?: number;
  locale?: string;
};

/**
 * Lookup a single non-referral discount code for checkout.
 * Does NOT mark the code as used (that remains /api/discount-usage).
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as ValidateBody;
    const rawCode = String(body.code || '').trim();
    const isEnglish =
      body.locale === 'en' || request.nextUrl.searchParams.get('locale') === 'en';

    if (!rawCode) {
      return NextResponse.json({
        success: false,
        error: isEnglish ? 'Please enter a discount code' : 'Lütfen bir indirim kodu girin',
      });
    }

    const { data: rows, error } = await supabaseAdmin
      .from('discount_codes')
      .select(
        'id, code, discount_amount, discount_type, valid_until, applicable_courses, max_usage, usage_count, is_used, is_referral, has_balance_limit, remaining_balance, owner_id, minimum_order_amount, full_course_only'
      )
      .eq('is_referral', false)
      .ilike('code', rawCode)
      .limit(5);

    if (error) {
      console.error('Discount validate query error:', error);
      return NextResponse.json(
        { success: false, error: isEnglish ? 'Invalid discount code' : 'Geçersiz indirim kodu' },
        { status: 500 }
      );
    }

    type DiscountLookup = {
      id: string;
      code: string;
      discount_amount: number;
      discount_type: string;
      valid_until: string | null;
      applicable_courses: string[] | null;
      max_usage: number | null;
      usage_count: number | null;
      is_used: boolean | null;
      is_referral: boolean | null;
      has_balance_limit: boolean | null;
      remaining_balance: number | null;
      owner_id: string | null;
      minimum_order_amount: number | null;
      full_course_only: boolean | null;
    };

    const discountCode = ((rows || []) as DiscountLookup[]).find(
      (r) => String(r.code || '').toLowerCase() === rawCode.toLowerCase()
    );

    if (!discountCode) {
      return NextResponse.json({
        success: false,
        error: isEnglish ? 'Invalid discount code' : 'Geçersiz indirim kodu',
      });
    }

    const validUntilStr = discountCode.valid_until as string | null;
    if (validUntilStr) {
      const validUntilEnd = new Date(validUntilStr);
      if (/^\d{4}-\d{2}-\d{2}$/.test(validUntilStr)) {
        validUntilEnd.setHours(23, 59, 59, 999);
      }
      if (validUntilEnd < new Date()) {
        return NextResponse.json({
          success: false,
          error: isEnglish ? 'This discount code has expired' : 'Bu indirim kodunun süresi dolmuş',
        });
      }
    }

    const maxUsage = Number(discountCode.max_usage ?? 0);
    const usageCount = Number(discountCode.usage_count ?? 0);
    if (maxUsage > 0 && usageCount >= maxUsage) {
      return NextResponse.json({
        success: false,
        error: isEnglish
          ? 'This code has reached its usage limit'
          : 'Bu kodun kullanım limiti dolmuş',
      });
    }

    if (maxUsage <= 1 && discountCode.is_used === true) {
      return NextResponse.json({
        success: false,
        error: isEnglish
          ? 'This discount code has already been used'
          : 'Bu indirim kodu daha önce kullanılmış',
      });
    }

    const applicableCourses = (discountCode.applicable_courses as string[]) || [];
    if (
      body.courseId &&
      body.itemType !== 'cart' &&
      applicableCourses.length > 0 &&
      !applicableCourses.includes(body.courseId)
    ) {
      return NextResponse.json({
        success: false,
        error: isEnglish
          ? 'This discount code is not applicable for this course'
          : 'Bu indirim kodu bu kurs için geçerli değil',
      });
    }

    const { fullCourseOnly, minimumOrderAmount } = resolveDiscountRestrictions(discountCode);

    if (fullCourseOnly && body.itemType !== 'cart') {
      if (body.itemType !== 'tier' || !body.isFullCourse) {
        return NextResponse.json({
          success: false,
          error: isEnglish
            ? 'This discount code is only valid for the full education package'
            : 'Bu indirim kodu yalnızca tam eğitim paketi için geçerlidir',
        });
      }
    }

    if (
      minimumOrderAmount > 0 &&
      body.coursePrice != null &&
      body.itemType !== 'cart' &&
      Number(body.coursePrice) < minimumOrderAmount
    ) {
      return NextResponse.json({
        success: false,
        error: isEnglish
          ? `This discount code requires a minimum order of ${minimumOrderAmount} ₺`
          : `Bu indirim kodu için minimum sipariş tutarı ${minimumOrderAmount.toLocaleString('tr-TR')} ₺ olmalıdır`,
      });
    }

    if (
      discountCode.has_balance_limit &&
      discountCode.remaining_balance !== null &&
      Number(discountCode.remaining_balance) <= 0
    ) {
      return NextResponse.json({
        success: false,
        error: isEnglish
          ? 'This discount code has no remaining balance'
          : 'Bu indirim kodunun kalan bakiyesi yok',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        code: discountCode.code,
        discountAmount: discountCode.discount_amount,
        type: discountCode.discount_type,
        validUntil: discountCode.valid_until,
        applicableCourses,
        max_usage: discountCode.max_usage,
        usage_count: discountCode.usage_count,
        is_referral: false,
        has_balance_limit: !!discountCode.has_balance_limit,
        remaining_balance: discountCode.remaining_balance ?? null,
        owner_id: discountCode.owner_id || null,
        minimum_order_amount: discountCode.minimum_order_amount ?? null,
        full_course_only: !!discountCode.full_course_only,
        fullCourseOnly,
        minimumOrderAmount,
      },
    });
  } catch (error) {
    console.error('Discount validate API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
