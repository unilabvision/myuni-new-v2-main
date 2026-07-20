import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../../../lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { code, userId, discountAmount, coursePrice, isFullCourse, itemType } = await request.json();
    const isEnglish = request.nextUrl.searchParams.get('locale') === 'en';

    if (!code || !userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Kod ve kullanıcı ID gerekli' 
      });
    }

    // İndirim kodunu bul
    const { data: discountCode, error: findError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code)
      .eq('is_referral', false) // Sadece indirim kodları
      .single();

    if (findError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Geçersiz indirim kodu' 
      });
    }

    if (!discountCode) {
      return NextResponse.json({ 
        success: false, 
        error: 'Geçersiz indirim kodu' 
      });
    }

    // Bakiye sınırlı olmayan (standart yüzdesel ve sabit tutarlı) kodlar için kullanıcı başına 1 kullanım sınırlaması
    if (!discountCode.has_balance_limit) {
      const { data: previousOrders, error: ordersError } = await supabase
        .from('orders')
        .select('orderid')
        .eq('status', 'completed')
        .eq('discountcode', code)
        .or(`useremail.eq."${userId}",custom_data->>userId.eq."${userId}",custom_data->>clerkUserId.eq."${userId}"`);

      if (ordersError) {
        console.error('Error checking previous orders:', ordersError);
      }

      if (previousOrders && previousOrders.length > 0) {
        return NextResponse.json({ 
          success: false, 
          error: isEnglish
            ? 'You have already used this discount code in a completed purchase. Each code can only be used once.'
            : 'Bu indirim kodunu daha önce başarıyla tamamlanan bir alışverişte kullandınız. Her kod yalnızca bir kez kullanılabilir.'
        });
      }
    }

    // Geçerlilik tarihi: valid_until = o günün sonu (23:59:59) kabul edilir
    const validUntilStr = discountCode.valid_until;
    if (validUntilStr) {
      const validUntilEnd = new Date(validUntilStr);
      validUntilEnd.setHours(23, 59, 59, 999);
      if (validUntilEnd < new Date()) {
        return NextResponse.json({ 
          success: false, 
          error: 'Bu indirim kodunun süresi dolmuş' 
        });
      }
    }

    // Kodun kullanım limitini kontrol et
    if (discountCode.usage_count >= discountCode.max_usage) {
      return NextResponse.json({ 
        success: false, 
        error: 'Bu kodun kullanım limiti dolmuş' 
      });
    }

    // Yalnızca tam eğitim paketi
    if (discountCode.full_course_only) {
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

    // Minimum sipariş tutarı (modül paketlerinin bedava kalmasını engeller)
    const minOrder = Number(discountCode.minimum_order_amount) || 0;
    if (minOrder > 0) {
      const price = Number(coursePrice) || 0;
      if (price < minOrder) {
        return NextResponse.json({
          success: false,
          error: isEnglish
            ? `This discount code requires a minimum order of ${minOrder} ₺`
            : `Bu indirim kodu için minimum sipariş tutarı ${minOrder.toLocaleString('tr-TR')} ₺ olmalıdır`,
        });
      }
    }

    // Bakiye limiti kontrolü - has_balance_limit=true ise discount_amount'u görmezden gel
    // Bakiye yeterliyse %100 indirim, yetersizse sadece kalan bakiye kadar indirim
    if (discountCode.has_balance_limit && discountCode.remaining_balance !== null) {
      if (!coursePrice || coursePrice <= 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Kurs fiyatı belirtilmedi' 
        });
      }
      
      // Bakiye kontrolü - discountAmount zaten checkout'ta hesaplanmış (bakiye yeterliyse %100, yetersizse kalan bakiye)
      if (discountCode.remaining_balance < discountAmount) {
        return NextResponse.json({ 
          success: false, 
          error: `Bu kodun kalan bakiyesi yetersiz. Kalan bakiye: ${discountCode.remaining_balance.toFixed(2)} TL` 
        });
      }
    }

    // Not: Bakiye düşümü ödeme başarılı olduğunda yapılacak.
    // has_balance_limit=true olan çek/voucher kodlarında "is_used=true" yapmak yanıltıcı olabilir (parçalı kullanım).
    // Bu yüzden burada sadece "son kullanan" bilgisi gibi kayıt atıyoruz; "is_used" flag'ini ödeme sonrası mantık belirleyecek.
    const { error: updateError } = await supabase
      .from('discount_codes')
      .update({
        used_by: userId,
        used_at: new Date().toISOString()
      })
      .eq('id', discountCode.id);

    if (updateError) {
      console.error('Error updating discount code usage:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: 'İndirim kodu güncellenemedi' 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'İndirim kodu başarıyla uygulandı'
    });

  } catch (error) {
    console.error('Discount usage error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'İndirim kodu işlemi başarısız' 
    });
  }
}
