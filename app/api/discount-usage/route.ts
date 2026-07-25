import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../../../lib/supabaseAdmin';
import { resolveDiscountRestrictions } from '../../../lib/discountRestrictions';

export async function POST(request: NextRequest) {
  try {
    const { code, userId, discountAmount, coursePrice, isFullCourse, itemType } = await request.json();
    const isEnglish = request.nextUrl.searchParams.get('locale') === 'en';

    if (!code || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Kod ve kullanıcı ID gerekli',
      });
    }

    const { data: discountCode, error: findError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code)
      .eq('is_referral', false)
      .single();

    if (findError || !discountCode) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz indirim kodu',
      });
    }

    if (!discountCode.has_balance_limit) {
      const { data: previousOrders, error: ordersError } = await supabase
        .from('orders')
        .select('orderid')
        .eq('status', 'completed')
        .eq('discountcode', code)
        .or(
          `useremail.eq."${userId}",custom_data->>userId.eq."${userId}",custom_data->>clerkUserId.eq."${userId}"`
        );

      if (ordersError) {
        console.error('Error checking previous orders:', ordersError);
      }

      if (previousOrders && previousOrders.length > 0) {
        return NextResponse.json({
          success: false,
          error: isEnglish
            ? 'You have already used this discount code in a completed purchase. Each code can only be used once.'
            : 'Bu indirim kodunu daha önce başarıyla tamamlanan bir alışverişte kullandınız. Her kod yalnızca bir kez kullanılabilir.',
        });
      }
    }

    const validUntilStr = discountCode.valid_until;
    if (validUntilStr) {
      const validUntilEnd = new Date(validUntilStr);
      validUntilEnd.setHours(23, 59, 59, 999);
      if (validUntilEnd < new Date()) {
        return NextResponse.json({
          success: false,
          error: 'Bu indirim kodunun süresi dolmuş',
        });
      }
    }

    if (discountCode.usage_count >= discountCode.max_usage) {
      return NextResponse.json({
        success: false,
        error: 'Bu kodun kullanım limiti dolmuş',
      });
    }

    // 2000₺+ fixed → min tutar (indirim+1); full_course_only yalnızca DB bayrağından
    const { fullCourseOnly, minimumOrderAmount } = resolveDiscountRestrictions(discountCode);

    if (fullCourseOnly) {
      const allowed =
        itemType === 'cart'
          ? Boolean(isFullCourse)
          : itemType === 'tier' && Boolean(isFullCourse);
      if (!allowed) {
        return NextResponse.json({
          success: false,
          error: isEnglish
            ? 'This discount code is only valid for the full education package'
            : 'Bu indirim kodu yalnızca tam eğitim paketi için geçerlidir',
        });
      }
    }

    if (minimumOrderAmount > 0) {
      const price = Number(coursePrice) || 0;
      if (price < minimumOrderAmount) {
        return NextResponse.json({
          success: false,
          error: isEnglish
            ? `This discount code requires a minimum order of ${minimumOrderAmount} ₺`
            : `Bu indirim kodu için minimum sipariş tutarı ${minimumOrderAmount.toLocaleString('tr-TR')} ₺ olmalıdır`,
        });
      }
    }

    if (discountCode.has_balance_limit && discountCode.remaining_balance !== null) {
      if (!coursePrice || coursePrice <= 0) {
        return NextResponse.json({
          success: false,
          error: 'Kurs fiyatı belirtilmedi',
        });
      }

      if (discountCode.remaining_balance < discountAmount) {
        return NextResponse.json({
          success: false,
          error: `Bu kodun kalan bakiyesi yetersiz. Kalan bakiye: ${discountCode.remaining_balance.toFixed(2)} TL`,
        });
      }
    }

    const { error: updateError } = await supabase
      .from('discount_codes')
      .update({
        used_by: userId,
        used_at: new Date().toISOString(),
      })
      .eq('id', discountCode.id);

    if (updateError) {
      console.error('Error updating discount code usage:', updateError);
      return NextResponse.json({
        success: false,
        error: 'İndirim kodu güncellenemedi',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'İndirim kodu başarıyla uygulandı',
    });
  } catch (error) {
    console.error('Discount usage error:', error);
    return NextResponse.json({
      success: false,
      error: 'İndirim kodu işlemi başarısız',
    });
  }
}
