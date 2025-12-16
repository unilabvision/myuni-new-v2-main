import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { code, userId, discountAmount, coursePrice } = await request.json();

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

    // Kodun kullanım limitini kontrol et
    if (discountCode.usage_count >= discountCode.max_usage) {
      return NextResponse.json({ 
        success: false, 
        error: 'Bu kodun kullanım limiti dolmuş' 
      });
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

    // Kodu sadece kullanıldı olarak işaretle (bakiye azaltma ödeme başarılı olduğunda yapılacak)
    const { error: updateError } = await supabase
      .from('discount_codes')
      .update({
        is_used: true,
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
