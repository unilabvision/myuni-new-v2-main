import { supabaseAdmin as supabase } from './supabaseAdmin';

export interface DiscountCode {
  id: string;
  code: string;
  discount_amount: number;
  discount_type: string;
  valid_until: string;
  applicable_courses: string[];
  created_at: string;
  max_usage: number;
  usage_count: number;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  influencer_id: string | null;
  campaign_id: string | null;
  commission: number;
  is_referral: boolean;
}

export interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  earnedDiscounts: number;
  pendingReferrals: number;
}

// Kullanıcı için referral kodu oluştur (0% indirim)
export async function createReferralCode(userId: string): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    // Önce kullanıcının zaten bir referral kodu var mı kontrol et (kullanılmış olsa bile)
    const { data: existingCode, error: checkError } = await supabase
      .from('discount_codes')
      .select('code')
      .eq('influencer_id', userId)
      .eq('is_referral', true)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    // Eğer zaten bir kod varsa onu döndür (kullanılmış olsa bile)
    if (existingCode) {
      return { success: true, code: existingCode.code };
    }

    // Yeni referral kodu oluştur - sabit format (kimlik gibi)
    // userId'den unique bir kod oluştur
    const userIdHash = userId.replace(/-/g, '').substring(0, 8).toUpperCase();
    // userId'yi hash'leyerek daha unique yap
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const hashStr = Math.abs(hash).toString(36).toUpperCase().substring(0, 6);
    const referralCode = `REF${userIdHash}${hashStr}`;
    
    // 500 yıl geçerli olacak şekilde tarih hesapla
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 500);

    const { data, error } = await supabase
      .from('discount_codes')
      .insert({
        code: referralCode,
        discount_amount: 0,
        discount_type: 'percentage',
        valid_until: validUntil.toISOString().split('T')[0],
        applicable_courses: [],
        max_usage: 99999, // Referral kodları sınırsız kullanım
        usage_count: 0,
        is_used: false,
        influencer_id: userId,
        commission: 0,
        is_referral: true
      })
      .select('code')
      .single();

    if (error) {
      throw error;
    }

    return { success: true, code: data.code };
  } catch (error) {
    console.error('Error creating referral code:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Referral kodu oluşturulamadı' 
    };
  }
}

// Referral kod kullanıldığında influencer'a ödül kodu oluştur
export async function createRewardCode(influencerId: string): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    console.log('=== ÖDÜL KODU OLUŞTURMA BAŞLADI ===');
    console.log('A kişisi (referral sahibi) Influencer ID:', influencerId);

    // Ödül kodu oluştur
    const rewardCode = `REWARD${influencerId.substring(0, 6).toUpperCase()}${Date.now().toString().slice(-4)}`;
    console.log('Oluşturulan ödül kodu:', rewardCode);
    
    // 3 gün geçerli olacak şekilde tarih hesapla
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 3);
    console.log('Geçerlilik tarihi:', validUntil.toISOString().split('T')[0]);

    const insertData = {
      code: rewardCode,
      discount_amount: 15,
      discount_type: 'percentage',
      valid_until: validUntil.toISOString().split('T')[0],
      applicable_courses: [],
      max_usage: 1, // Ödül kodları tek kullanımlık
      usage_count: 0,
      is_used: false,
      influencer_id: influencerId,
      commission: 0,
      is_referral: false
    };

    console.log('Veritabanına eklenecek veri:', insertData);

    const { data, error } = await supabase
      .from('discount_codes')
      .insert(insertData)
      .select('code')
      .single();

    console.log('Veritabanı insert sonucu:', { data, error });

    if (error) {
      console.error('Veritabanı insert hatası:', error);
      throw error;
    }

    console.log('=== ÖDÜL KODU BAŞARIYLA OLUŞTURULDU ===');
    console.log('A kişisine oluşturulan REWARDUSER kodu:', data.code);
    return { success: true, code: data.code };
  } catch (error) {
    console.error('Error creating reward code:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Ödül kodu oluşturulamadı' 
    };
  }
}

// Kullanıcının referral istatistiklerini getir
export async function getReferralStats(userId: string): Promise<ReferralStats> {
  try {
    // Kullanıcının referral kodunu bul
    const { data: referralCode } = await supabase
      .from('discount_codes')
      .select('code')
      .eq('influencer_id', userId)
      .eq('is_referral', true)
      .single();

    if (!referralCode) {
      return {
        totalReferrals: 0,
        successfulReferrals: 0,
        earnedDiscounts: 0,
        pendingReferrals: 0
      };
    }

    // Bu kodla yapılan tüm kullanımları getir
    const { data: usedCodes, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', referralCode.code)
      .eq('is_used', true);

    if (error) {
      throw error;
    }

    // Kullanıcının kazandığı ödül kodlarını getir
    const { data: rewardCodes, error: rewardError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('influencer_id', userId)
      .eq('is_referral', false)
      .eq('discount_amount', 15);

    if (rewardError) {
      throw rewardError;
    }

    const totalReferrals = usedCodes?.length || 0;
    const earnedDiscounts = rewardCodes?.length || 0;

    return {
      totalReferrals,
      successfulReferrals: totalReferrals,
      earnedDiscounts,
      pendingReferrals: 0
    };
  } catch (error) {
    console.error('Error getting referral stats:', error);
    return {
      totalReferrals: 0,
      successfulReferrals: 0,
      earnedDiscounts: 0,
      pendingReferrals: 0
    };
  }
}

// Kullanıcının referral kodunu getir (kullanılmış olsa bile)
export async function getUserReferralCode(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('code')
      .eq('influencer_id', userId)
      .eq('is_referral', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data?.code || null;
  } catch (error) {
    console.error('Error getting user referral code:', error);
    return null;
  }
}

// Kullanıcının ödül kodlarını getir
export async function getUserRewardCodes(userId: string): Promise<DiscountCode[]> {
  try {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('influencer_id', userId)
      .eq('is_referral', false)
      .eq('discount_amount', 15)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error getting user reward codes:', error);
    return [];
  }
}


// Referral kod kullanımını işle
export async function handleReferralUsage(code: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Referral kodunu bul ve kullan
    const { data: discountCode, error: findError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code)
      .eq('is_referral', true)
      .single();

    if (findError) {
      throw findError;
    }

    if (!discountCode || !discountCode.influencer_id) {
      return { success: false, error: 'Geçersiz referral kodu' };
    }

    // Kişi kendi referral kodunu kullanamaz
    if (discountCode.influencer_id === userId) {
      return { success: false, error: 'Kendi referral kodunu kullanamazsın' };
    }

    // Referral kodları sınırsız kullanım hakkına sahip (max_usage: 99999)
    // Kullanım limiti kontrolü gerekmiyor

    // Referral kodu kullanıldı olarak işaretle
    console.log('=== REFERRAL KODU KULLANILDI ===');
    console.log('Referral kodu ID:', discountCode.id);
    console.log('Kullanıcı ID:', userId);
    console.log('Referral sahibi ID:', discountCode.influencer_id);
    
    // Kodu kullanıldı olarak işaretle (usage_count ödeme sonrası artırılacak)
    const { data: updateResult, error: updateError } = await supabase
      .from('discount_codes')
      .update({
        is_used: true,
        used_by: userId,
        used_at: new Date().toISOString()
      })
      .eq('id', discountCode.id)
      .select();

    console.log('Update result:', updateResult);
    console.log('Update error:', updateError);

    if (updateError) {
      throw updateError;
    }

    // Referral kodu kullanıldı olarak işaretlendi
    // Ödül kodu sadece satın alma işlemi tamamlandığında oluşturulacak
    console.log(`=== REFERRAL KODU KULLANILDI ===`);
    console.log(`Referral kodu: ${code}`);
    console.log(`Kullanan kişi (B): ${userId}`);
    console.log(`Referral sahibi (A): ${discountCode.influencer_id}`);
    console.log(`Ödül kodu satın alma işlemi tamamlandığında oluşturulacak`);

    return { success: true };
  } catch (error) {
    console.error('Error handling referral usage:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Referral işlemi başarısız' 
    };
  }
}

function roundMoney(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/**
 * Consumes the discount code applied to a specific completed order —
 * incrementing usage_count and decrementing remaining_balance (for
 * balance-limited codes) atomically.
 *
 * This REPLACES the previous `incrementUsageCountAfterPayment(userId)`,
 * which had two independent, serious bugs:
 *  1. It only ever looked at codes where `is_used = true`, but the normal
 *     (non-referral) checkout discount path never set `is_used`, so
 *     ordinary single-use/balance-limited codes were never actually
 *     consumed — they could be reused without limit.
 *  2. Even when it did find a code, it "guessed" which order to pull the
 *     discount amount from by scanning the last 20 completed orders
 *     globally and matching on userId — under concurrent traffic this could
 *     easily attribute the wrong order's discount to a balance-limited code.
 *
 * This version is keyed directly to the order that just completed via the
 * `discountCodeId` recorded on it at checkout time (see
 * `app/api/iyzico-payment/route.ts`), and uses an optimistic
 * compare-and-swap update (`.eq('usage_count', currentUsage)`) so two orders
 * racing to consume the same code can never both succeed — the loser's
 * conditional UPDATE affects zero rows and retries against fresh state
 * instead of silently double-spending the code's usage limit / balance.
 */
export async function consumeDiscountCodeForOrder(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('discountamount, custom_data')
      .eq('orderid', orderId)
      .maybeSingle();

    if (orderError || !order) {
      return { success: false, error: orderError?.message || 'Sipariş bulunamadı' };
    }

    const customData = (order.custom_data || {}) as Record<string, unknown>;

    // Idempotency: a retried/replayed delivery for the same order (e.g. after
    // the callback recovers a `payment_error` order) must never consume the
    // code twice.
    if (customData.discountConsumedAt) {
      return { success: true };
    }

    const codeId = customData.discountCodeId as string | null | undefined;
    if (!codeId) {
      return { success: true }; // Bu siparişte indirim kodu kullanılmadı
    }

    const discountAmount =
      parseFloat(
        order.discountamount?.toString() ||
          (customData.totalDiscount as string | number | undefined)?.toString() ||
          '0'
      ) || 0;

    const MAX_ATTEMPTS = 5;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const { data: codeRow, error: codeError } = await supabase
        .from('discount_codes')
        .select('id, usage_count, max_usage, has_balance_limit, remaining_balance, is_referral')
        .eq('id', codeId)
        .maybeSingle();

      if (codeError) {
        return { success: false, error: codeError.message };
      }
      if (!codeRow) {
        // Code was deleted after checkout — nothing to consume.
        break;
      }
      if (codeRow.is_referral) {
        // Referral codes have unlimited usage; their reward bookkeeping is
        // handled separately by createRewardCodeAfterPayment.
        break;
      }

      const currentUsage = Number(codeRow.usage_count) || 0;
      const maxUsage = Number(codeRow.max_usage) || 0;
      if (maxUsage > 0 && currentUsage >= maxUsage) {
        console.warn(`Discount code ${codeId} already at its usage limit; order ${orderId} will not decrement it further.`);
        break;
      }

      const updateData: Record<string, unknown> = { usage_count: currentUsage + 1 };
      if (codeRow.has_balance_limit && codeRow.remaining_balance !== null) {
        updateData.remaining_balance = Math.max(
          0,
          roundMoney(Number(codeRow.remaining_balance) - discountAmount)
        );
      }
      if (maxUsage <= 1) {
        updateData.is_used = true;
      }

      const { data: updated, error: updateError } = await supabase
        .from('discount_codes')
        .update(updateData)
        .eq('id', codeId)
        .eq('usage_count', currentUsage) // compare-and-swap guard
        .select('id');

      if (updateError) {
        return { success: false, error: updateError.message };
      }
      if (updated && updated.length > 0) {
        break; // Successfully consumed
      }
      // Someone else updated usage_count concurrently — retry against fresh state.
    }

    // Mark the order so a future retry never re-consumes this code.
    const { error: markError } = await supabase
      .from('orders')
      .update({
        custom_data: { ...customData, discountConsumedAt: new Date().toISOString() },
      })
      .eq('orderid', orderId);

    if (markError) {
      console.error('Failed to mark discount code as consumed on order:', orderId, markError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error consuming discount code for order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'İndirim kodu tüketilemedi',
    };
  }
}

// Ödeme tamamlandığında referral ödül kodu oluştur
export async function createRewardCodeAfterPayment(userId: string): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    console.log('=== REFERRAL ÖDÜL KODU OLUŞTURMA BAŞLADI ===');
    console.log('Satın alma yapan kişi (B) User ID:', userId);
    console.log('Fonksiyon çağrıldı:', new Date().toISOString());

    // DEBUG: Bu kullanıcının kullandığı tüm kodları kontrol et
    console.log('=== DEBUG: KULLANICI KODLARI KONTROL ===');
    const { data: allUsedCodes, error: allCodesError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('used_by', userId)
      .eq('is_used', true);
    
    console.log('Bu kullanıcının kullandığı tüm kodlar:', allUsedCodes);
    console.log('Query error:', allCodesError);
    
    // Referral kodları için ayrı sorgu
    const { data: referralCodes, error: referralCodesError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('used_by', userId)
      .eq('is_used', true)
      .eq('is_referral', true);
    
    console.log('Bu kullanıcının kullandığı referral kodları:', referralCodes);
    console.log('Referral codes query error:', referralCodesError);

    // Bu kullanıcının kullandığı referral kodunu bul
    console.log('=== REFERRAL KODU ARAMA BAŞLADI ===');
    console.log('Aranan User ID:', userId);
    
    const { data: usedReferralCode, error: findError } = await supabase
      .from('discount_codes')
      .select('influencer_id, code, used_by, is_used, created_at')
      .eq('used_by', userId)
      .eq('is_referral', true)
      .eq('is_used', true)
      .not('code', 'like', 'REWARD%') // Ödül kodları değil, orijinal referral kodları
      .order('created_at', { ascending: false }) // En son kullanılanı getir
      .single();

    console.log('Used referral code query result:', { usedReferralCode, findError });

    if (findError) {
      if (findError.code === 'PGRST116') {
        // Bu kullanıcı referral kodu kullanmamış
        console.log('Bu kullanıcı referral kodu kullanmamış');
        return { success: true }; // Hata değil, sadece referral kodu yok
      } else {
        console.error('Referral kodu arama hatası:', findError);
        return { success: false, error: findError.message };
      }
    }

    if (!usedReferralCode) {
      console.log('Referral kodu bulunamadı');
      return { success: true }; // Hata değil, sadece referral kodu yok
    }

    console.log('Kullanılan referral kodu bulundu:', usedReferralCode);
    console.log('Referral sahibi (A) influencer_id:', usedReferralCode.influencer_id);

    // Referral sahibine ödül kodu oluştur
    console.log('Referral sahibine ödül kodu oluşturuluyor...');
    const rewardResult = await createRewardCode(usedReferralCode.influencer_id);
    
    console.log('Ödül kodu oluşturma sonucu:', rewardResult);

    if (!rewardResult.success) {
      console.error('Ödül kodu oluşturulamadı:', rewardResult.error);
      return { success: false, error: rewardResult.error };
    }

    console.log('=== REFERRAL ÖDÜL KODU BAŞARIYLA OLUŞTURULDU ===');
    console.log('A kişisine (referral sahibi) oluşturulan ödül kodu:', rewardResult.code);
    return { success: true, code: rewardResult.code };
  } catch (error) {
    console.error('Error creating reward code after payment:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Ödül kodu oluşturulamadı' 
    };
  }
}

