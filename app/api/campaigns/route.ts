import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = (searchParams.get('locale') || 'tr').toLowerCase();
    // discount_codes tablosundan is_campaign = true olan kayıtları çek
    const { data: campaigns, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('is_campaign', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Campaigns fetch error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Verileri frontend'in beklediği formata dönüştür
    const formattedCampaigns = campaigns?.map(campaign => {
      const now = new Date();
      const validUntil = new Date(campaign.valid_until);
      const isActive = !campaign.is_used && validUntil > now && (campaign.usage_count || 0) < (campaign.max_usage || 1);
      
      // Kampanya kapak görselini veritabanından al, yoksa varsayılan kullan
      const campaignImage = campaign.campaign_cover_image && campaign.campaign_cover_image.trim() !== '' 
        ? campaign.campaign_cover_image 
        : 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop&crop=center';
      
      // Locale-aware title/description
      const localizedTitle = locale === 'en'
        ? (campaign.campaign_name_en || campaign.campaign_name || campaign.code)
        : (campaign.campaign_name || campaign.code);
      // Also support a possible typo column `campaign_discription_en`
      const localizedDescription = locale === 'en'
        ? (campaign.campaign_description_en || campaign.campaign_discription_en || campaign.campaign_description || `${campaign.discount_amount}% indirim kodu`)
        : (campaign.campaign_description || `${campaign.discount_amount}% indirim kodu`);
      
      return {
        id: campaign.id,
        title: localizedTitle,
        description: localizedDescription,
        type: 'discount' as const,
        discount_percentage: campaign.discount_type === 'percentage' ? campaign.discount_amount : null,
        discount_amount: campaign.discount_type === 'fixed' ? campaign.discount_amount : null,
        code: campaign.code,
        valid_until: campaign.valid_until,
        image: campaignImage,
        is_featured: false, // Şimdilik tüm kampanyalar featured değil
        is_active: isActive,
        category: 'İndirim',
        usage_count: campaign.usage_count || 0,
        max_usage: campaign.max_usage || 1,
        // Detay sayfası için ek bilgiler
        campaign_name: localizedTitle,
        campaign_description: localizedDescription,
        created_at: campaign.created_at,
        discount_type: campaign.discount_type,
        applicable_courses: campaign.applicable_courses || [],
        campaign_slug: campaign.campaign_slug || null
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: formattedCampaigns
    });

  } catch (error) {
    console.error('Campaigns API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
