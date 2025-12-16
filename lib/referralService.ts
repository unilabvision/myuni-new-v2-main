import { supabase } from './supabase';

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

// Ödeme tamamlandığında kullanılan kodların usage_count'unu artır
export async function incrementUsageCountAfterPayment(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('=== USAGE COUNT ARTIRMA BAŞLADI ===');
    console.log('User ID:', userId);

    // Sadece indirim kodları için usage_count artır (referral kodları değil)
    // Ayrıca bakiye limiti olan kodlar için balance bilgisini de al
    const { data: usedDiscountCodes, error: findError } = await supabase
      .from('discount_codes')
      .select('id, usage_count, code, is_referral, has_balance_limit, remaining_balance')
      .eq('used_by', userId)
      .eq('is_used', true)
      .eq('is_referral', false); // Sadece indirim kodları

    if (findError) {
      throw findError;
    }

    if (!usedDiscountCodes || usedDiscountCodes.length === 0) {
      console.log('No discount codes found for user:', userId);
      return { success: true }; // Kullanılan indirim kodu yok, hata değil
    }

    console.log(`Found ${usedDiscountCodes.length} discount codes to update usage count for user:`, userId);

    // Orders tablosundan kullanılan indirim kodunu ve indirim miktarını al
    // userid yerine custom_data içindeki clerkUserId veya userId ile eşleştir
    const { data: orderDataList, error: orderError } = await supabase
      .from('orders')
      .select('discountcode, discountamount, custom_data, created_at, status')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(20);

    // En son tamamlanmış siparişi bul (custom_data içinde userId veya clerkUserId ile eşleşen)
    let orderData = null;
    if (!orderError && orderDataList) {
      orderData = orderDataList.find(order => {
        const orderUserId = order.custom_data?.clerkUserId || order.custom_data?.userId;
        return orderUserId === userId;
      });
      
      // Eğer bulunamazsa, userid kolonunu da dene (eğer varsa)
      if (!orderData) {
        const { data: orderByUserId, error: userIdError } = await supabase
          .from('orders')
          .select('discountcode, discountamount, custom_data, created_at, status')
          .eq('status', 'completed')
          .eq('userid', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (!userIdError && orderByUserId) {
          orderData = orderByUserId;
        }
      }
    }

    let discountCodeString = '';
    let discountAmount = 0;
    if (orderData) {
      // discountcode kolonundan veya custom_data'dan al
      discountCodeString = orderData.discountcode || orderData.custom_data?.discountCodes || '';
      discountAmount = parseFloat(orderData.discountamount?.toString() || orderData.custom_data?.totalDiscount?.toString() || '0') || 0;
    }

    console.log('=== BALANCE UPDATE DEBUG ===');
    console.log('User ID:', userId);
    console.log('Order discount info:', { discountCodeString, discountAmount, orderError });
    console.log('Used discount codes:', usedDiscountCodes.map(c => ({ code: c.code, has_balance_limit: c.has_balance_limit, remaining_balance: c.remaining_balance })));

    // Her kullanılan indirim kodu için usage_count'u artır ve bakiyeyi azalt
    for (const code of usedDiscountCodes) {
      console.log(`Updating usage count for discount code: ${code.code}`);
      
      const updateData: any = {
        usage_count: code.usage_count + 1
      };

      // Eğer bakiye limiti aktifse, bakiyeyi gerçek kullanılan indirim miktarı kadar azalt
      if (code.has_balance_limit && code.remaining_balance !== null && discountAmount > 0) {
        // Discount code eşleşmesi - tam eşleşme veya içeriyor mu kontrol et
        const codeMatches = discountCodeString && (
          discountCodeString === code.code || 
          discountCodeString.includes(code.code) ||
          discountCodeString.split(',').map(c => c.trim()).includes(code.code)
        );
        
        if (codeMatches) {
          const newBalance = code.remaining_balance - discountAmount;
          updateData.remaining_balance = Math.max(0, newBalance); // Negatif olamaz
          console.log(`✅ Balance updated for code ${code.code}: ${code.remaining_balance} - ${discountAmount} = ${newBalance}`);
        } else {
          console.log(`⚠️ Code mismatch: order code="${discountCodeString}", discount code="${code.code}"`);
        }
      } else {
        console.log(`ℹ️ Skipping balance update for code ${code.code}: has_balance_limit=${code.has_balance_limit}, remaining_balance=${code.remaining_balance}, discountAmount=${discountAmount}`);
      }
      
      const { error: updateError } = await supabase
        .from('discount_codes')
        .update(updateData)
        .eq('id', code.id);

      if (updateError) {
        console.error('Error updating discount code:', code.id, updateError);
        // Bir kodda hata olsa bile diğerlerini güncellemeye devam et
      } else {
        console.log(`Successfully updated discount code: ${code.code}`);
      }
    }

    // Referral kodları için ayrı log
    const { data: usedReferralCodes, error: referralError } = await supabase
      .from('discount_codes')
      .select('id, code, is_referral')
      .eq('used_by', userId)
      .eq('is_used', true)
      .eq('is_referral', true);

    if (!referralError && usedReferralCodes && usedReferralCodes.length > 0) {
      console.log(`Found ${usedReferralCodes.length} referral codes used by user (usage_count not updated):`, usedReferralCodes.map(c => c.code));
    }

    console.log('=== USAGE COUNT ARTIRMA TAMAMLANDI ===');
    return { success: true };
  } catch (error) {
    console.error('Error incrementing usage count after payment:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Usage count güncellenemedi' 
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

