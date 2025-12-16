'use client';

import React, { useEffect, useState, use } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { ChevronRight, Calendar, ArrowLeft, Tag, Copy, Share2, Clock, Users, Gift, Percent } from 'lucide-react';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Page Layout Component
import PageLayout from '@/app/components/layout/PageLayout';

// Supported languages
type SupportedLocale = 'tr' | 'en';

// Page parameters type
interface PageParams {
  locale: string;
  slug: string;
}

// Campaign interface
interface Campaign {
  id: string;
  code: string;
  discount_amount: number;
  discount_type: string;
  valid_until: string;
  applicable_courses: string[];
  created_at: string;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  influencer_id: string | null;
  campaign_id: string | null;
  commission: number;
  is_referral: boolean;
  max_usage: number;
  usage_count: number;
  is_campaign: boolean;
  campaign_name: string;
  campaign_description: string;
  campaign_cover_image: string | null;
  campaign_slug: string | null;
}

function stripMarkdown(input: string | null | undefined, maxLength: number = 120): string {
  if (!input || typeof input !== 'string') return '';
  const plain = input
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/`+/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return plain.substring(0, maxLength) + (plain.length > maxLength ? '...' : '');
}

// Function to create slug from campaign name
function createSlug(name: string | null | undefined): string {
  if (!name || typeof name !== 'string') {
    return '';
  }
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

// Function to get campaign by slug
async function getCampaignBySlug(slug: string): Promise<Campaign | null> {
  try {
    // First try direct lookup by campaign_slug
    const bySlug = await supabase
      .from('discount_codes')
      .select('*')
      .eq('is_campaign', true)
      .eq('campaign_slug', slug)
      .limit(1)
      .maybeSingle();

    if (bySlug.error && bySlug.error.code !== 'PGRST116') {
      console.error('Error fetching campaign by campaign_slug:', bySlug.error);
      return null;
    }

    if (bySlug.data) {
      return bySlug.data as unknown as Campaign;
    }

    // Fallback: legacy records without campaign_slug, match on generated slug from name
    const { data: campaigns, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('is_campaign', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns for fallback:', error);
      return null;
    }

    const fallback = campaigns?.find(c => {
      if (!c.campaign_name) return false;
      return createSlug(c.campaign_name) === slug;
    });

    return fallback || null;
  } catch (error) {
    console.error('Error in getCampaignBySlug:', error);
    return null;
  }
}

// Function to get related campaigns
async function getRelatedCampaigns(currentCampaignId: string, limit: number = 3): Promise<Campaign[]> {
  try {
    const { data: campaigns, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('is_campaign', true)
      .neq('id', currentCampaignId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching related campaigns:', error);
      return [];
    }

    return campaigns || [];
  } catch (error) {
    console.error('Error in getRelatedCampaigns:', error);
    return [];
  }
}

// Function to format date in the desired format based on locale
function formatDate(dateString: string, locale: string): string {
  const date = new Date(dateString);
  
  if (locale === 'tr') {
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  } else {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }
}

// Main component
export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = use(params);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [relatedCampaigns, setRelatedCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);
  const [copiedMobile, setCopiedMobile] = useState<boolean>(false);

  useEffect(() => {
    async function loadCampaignData() {
      try {
        setLoading(true);
        
        // Get campaign data
        const campaignData = await getCampaignBySlug(slug);
        if (!campaignData) {
          notFound();
          return;
        }
        setCampaign(campaignData);

        // Get related campaigns
        const relatedData = await getRelatedCampaigns(campaignData.id);
        setRelatedCampaigns(relatedData);
      } catch (error) {
        console.error('Error loading campaign data:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    }

    loadCampaignData();
  }, [slug]);

  // Live countdown for remaining time until valid_until
  useEffect(() => {
    if (!campaign) return;
    const end = new Date(campaign.valid_until).getTime();

    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, end - now);
      setTimeLeftMs(diff);
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [campaign]);

  const formatTimeLeft = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (locale === 'tr') {
      return `${days}g ${hours}s ${minutes}d ${seconds}sn`;
    }
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  if (loading) {
    return (
      <PageLayout
        title="Yükleniyor..."
        description=""
        locale={locale}
        breadcrumbs={[]}
        variant="minimal"
      >
        <div className="bg-white dark:bg-neutral-900 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="h-[400px] bg-neutral-200 dark:bg-neutral-700 rounded-lg mb-8"></div>
              <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!campaign) {
    notFound();
    return null;
  }

  // Language check
  if (locale !== 'tr' && locale !== 'en') {
    notFound();
  }

  // Format dates
  const createdDate = campaign ? formatDate(campaign.created_at, locale) : '';
  const validUntil = campaign ? formatDate(campaign.valid_until, locale) : '';

  // Check if campaign is active
  const now = new Date();
  const validUntilDate = campaign ? new Date(campaign.valid_until) : new Date();
  const isActive = campaign && !campaign.is_used && validUntilDate > now && campaign.usage_count < campaign.max_usage;

  // Translations
  const texts = {
    tr: {
      backToCampaigns: 'Kampanyalara Dön',
      campaignCode: 'Kampanya Kodu',
      copyCode: 'Kodu Kopyala',
      shareCode: 'Paylaş',
      campaignDetails: 'Kampanya Detayları',
      discountAmount: 'İndirim Miktarı',
      validUntil: 'Son Kullanma Tarihi',
      maxUsage: 'Maksimum Kullanım',
      currentUsage: 'Mevcut Kullanım',
      createdAt: 'Oluşturulma Tarihi',
      status: 'Durum',
      active: 'Aktif',
      expired: 'Süresi Dolmuş',
      used: 'Kullanılmış',
      applicableCourses: 'Geçerli Kurslar',
      allCourses: 'Tüm Kurslar',
      relatedCampaigns: 'İlgili Kampanyalar',
      viewDetails: 'Detayları Gör',
      home: 'Ana Sayfa',
      campaigns: 'Kampanyalar'
    },
    en: {
      backToCampaigns: 'Back to Campaigns',
      campaignCode: 'Campaign Code',
      copyCode: 'Copy Code',
      shareCode: 'Share',
      campaignDetails: 'Campaign Details',
      discountAmount: 'Discount Amount',
      validUntil: 'Valid Until',
      maxUsage: 'Maximum Usage',
      currentUsage: 'Current Usage',
      createdAt: 'Created At',
      status: 'Status',
      active: 'Active',
      expired: 'Expired',
      used: 'Used',
      applicableCourses: 'Applicable Courses',
      allCourses: 'All Courses',
      relatedCampaigns: 'Related Campaigns',
      viewDetails: 'View Details',
      home: 'Home',
      campaigns: 'Campaigns'
    }
  };

  const t = texts[locale as keyof typeof texts];

  // Client-side handlers
  const handleCopyCode = async (code: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
        return;
      }
      // Fallback for mobile browsers without Clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      const selection = document.getSelection();
      const selected = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      textarea.select();
      try {
        document.execCommand('copy');
      } catch (e) {
        console.error('execCommand copy failed:', e);
      }
      document.body.removeChild(textarea);
      if (selected && selection) {
        selection.removeAllRanges();
        selection.addRange(selected);
      }
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleShare = async (campaign: Campaign) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: campaign.campaign_name,
          text: `${campaign.campaign_name} - ${campaign.code}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    }
  };

  return (
    <PageLayout
      title={campaign.campaign_name}
      description={campaign.campaign_description || ''}
      locale={locale}
      breadcrumbs={[
        { name: t.campaigns, href: `/${locale}/kampanyalar` },
        { name: campaign.campaign_name, href: `/${locale}/kampanyalar/${slug}` }
      ]}
      variant="minimal"
    >
      <article className="bg-white dark:bg-neutral-900 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-6 py-8 md:pb-8 pb-24">
          {/* Back Navigation */}
          <div className="mb-8">
            <Link 
              href={`/${locale}/kampanyalar`}
              className="inline-flex items-center text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.backToCampaigns}
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Hero Section */}
              <div className="relative h-[400px] mb-8 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                {campaign.campaign_cover_image ? (
                  <Image
                    src={campaign.campaign_cover_image}
                    alt={campaign.campaign_name}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Gift className="w-24 h-24 text-neutral-400" />
                  </div>
                )}
                
                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                
                {/* Campaign info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-medium text-white mb-4">
                        {campaign.campaign_name}
                      </h1>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-white/90">
                          <span className="text-lg font-medium">
                            {campaign.discount_type === 'percentage' ? '%' : ''}{campaign.discount_amount}
                            {campaign.discount_type === 'fixed' ? ' TL' : ''} {locale === 'tr' ? 'İndirim' : 'Discount'}
                          </span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isActive 
                            ? 'bg-green-500 text-white' 
                            : 'bg-red-500 text-white'
                        }`}>
                          {isActive ? t.active : (validUntilDate < now ? t.expired : t.used)}
                        </div>
                      </div>
                      {/* Countdown badge removed from hero as requested */}
                    </div>
                  </div>
                </div>
              </div>

              {/* Countdown Section */}
              {timeLeftMs > 0 && campaign.code !== 'HOŞGELDİN15' && (
                <div className={`mb-8 rounded-lg p-5 border shadow-sm flex items-center justify-between flex-col sm:flex-row gap-4 ${
                  timeLeftMs <= 48 * 3600 * 1000
                    ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                    : 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
                }`}>
                  <div className="flex items-center gap-3">
                    <Clock className={`w-6 h-6 ${
                      timeLeftMs <= 48 * 3600 * 1000 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
                    }`} />
                    <div>
                      <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        {formatTimeLeft(timeLeftMs)}
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {locale === 'tr' ? (timeLeftMs <= 24 * 3600 * 1000 ? 'Son şans! Kaçırmayın' : 'Az kaldı! Fırsatı yakalayın') : (timeLeftMs <= 24 * 3600 * 1000 ? 'Last chance! Don\'t miss it' : 'Hurry up! Limited time')}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    {locale === 'tr' ? 'Son Kullanma Tarihi:' : 'Valid Until:'} {validUntil}
                  </div>
                </div>
              )}

              {/* Campaign Description */}
              {campaign.campaign_description && (
                <div className="mb-8">
                  <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-h5:text-base prose-h6:text-sm">
                    <ReactMarkdown
                      components={{
                        h1: ({children}) => <h1 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4 mt-6">{children}</h1>,
                        h2: ({children}) => <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3 mt-5">{children}</h2>,
                        h3: ({children}) => <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3 mt-4">{children}</h3>,
                        h4: ({children}) => <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2 mt-3">{children}</h4>,
                        h5: ({children}) => <h5 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-2 mt-3">{children}</h5>,
                        h6: ({children}) => <h6 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2 mt-3">{children}</h6>,
                        p: ({children}) => <p className="text-neutral-700 dark:text-neutral-300 mb-4 leading-relaxed">{children}</p>,
                        ul: ({children}) => <ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 mb-4 space-y-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside text-neutral-700 dark:text-neutral-300 mb-4 space-y-1">{children}</ol>,
                        li: ({children}) => <li className="text-neutral-700 dark:text-neutral-300">{children}</li>,
                        strong: ({children}) => <strong className="font-semibold text-neutral-900 dark:text-neutral-100">{children}</strong>,
                        em: ({children}) => <em className="italic text-neutral-800 dark:text-neutral-200">{children}</em>
                      }}
                    >
                      {campaign.campaign_description}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Campaign Details */}
              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-6">
                  {t.campaignDetails}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                        {t.discountAmount}
                      </h3>
                      <p className="text-base text-neutral-900 dark:text-neutral-100">
                        {campaign.discount_type === 'percentage' ? '%' : ''}{campaign.discount_amount}
                        {campaign.discount_type === 'fixed' ? ' TL' : ''}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                        {t.validUntil}
                      </h3>
                      <p className="text-base text-neutral-900 dark:text-neutral-100">
                        {validUntil}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                        {t.maxUsage}
                      </h3>
                      <p className="text-base text-neutral-900 dark:text-neutral-100">
                        {campaign.max_usage}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                        {t.status}
                      </h3>
                      <p className={`text-base font-medium ${
                        isActive 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {isActive ? t.active : (validUntilDate < now ? t.expired : t.used)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Applicable Courses */}
              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-6">
                <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                  {t.applicableCourses}
                </h2>
                {campaign.applicable_courses && campaign.applicable_courses.length > 0 ? (
                  <div className="space-y-2">
                    {campaign.applicable_courses.map((course, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-neutral-500" />
                        <span className="text-neutral-700 dark:text-neutral-300">{course}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-600 dark:text-neutral-400">{t.allCourses}</p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Campaign Code Card */}
              <div className="sticky top-20 md:top-28">
                <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 mb-8 shadow-sm">
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                    {t.campaignCode}
                  </h3>
                  
                  <div className="bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg p-4 mb-4">
                    <code className="text-2xl font-mono font-bold text-neutral-900 dark:text-neutral-100 break-all">
                      {campaign.code}
                    </code>
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleCopyCode(campaign.code)}
                      className="flex-1 bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white px-4 py-2 text-sm font-medium transition-all duration-300 flex items-center justify-center rounded-lg"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {t.copyCode}
                    </button>
                    
                    <button 
                      onClick={() => handleShare(campaign)}
                      className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-100 text-neutral-900 dark:text-neutral-100 px-4 py-2 text-sm font-medium transition-all duration-300 flex items-center justify-center rounded-lg"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Related Campaigns */}
                {relatedCampaigns.length > 0 && (
                  <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                      {t.relatedCampaigns}
                    </h3>
                    
                    <div className="space-y-4">
                      {relatedCampaigns.map((relatedCampaign) => {
                        const relatedSlug = relatedCampaign.campaign_slug || createSlug(relatedCampaign.campaign_name);
                        // Skip campaigns without valid names
                        if (!relatedSlug) return null;
                        
                        return (
                          <Link
                            key={relatedCampaign.id}
                            href={`/${locale}/kampanyalar/${relatedSlug}`}
                            className="block p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                          >
                            <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1 line-clamp-2">
                              {relatedCampaign.campaign_name}
                            </h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2 line-clamp-2">
                              {stripMarkdown(relatedCampaign.campaign_description, 160)}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                {relatedCampaign.discount_type === 'percentage' ? '%' : ''}{relatedCampaign.discount_amount}
                                {relatedCampaign.discount_type === 'fixed' ? ' TL' : ''} 
                                {locale === 'tr' ? ' İndirim' : ' Discount'}
                              </span>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {t.viewDetails}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Mobile fixed bar: countdown + code */}
        {campaign && timeLeftMs > 0 && campaign.code !== 'HOŞGELDİN15' && (
          <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t ${
            timeLeftMs <= 48 * 3600 * 1000
              ? 'bg-red-600 text-white border-red-700'
              : 'bg-yellow-400 text-neutral-900 border-yellow-500'
          }`}>
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Clock className="w-5 h-5 shrink-0" />
                <div className="leading-tight min-w-0">
                  <div className="text-sm font-semibold truncate">{formatTimeLeft(timeLeftMs)}</div>
                  <div className="text-xs opacity-90 truncate">
                    {locale === 'tr' ? (timeLeftMs <= 24 * 3600 * 1000 ? 'Son şans! Kaçırmayın' : 'Az kaldı! Fırsatı yakalayın') : (timeLeftMs <= 24 * 3600 * 1000 ? 'Last chance! Don\'t miss it' : 'Hurry up! Limited time')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <code className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                  timeLeftMs <= 48 * 3600 * 1000 ? 'bg-white/20' : 'bg-black/10'
                }`}>{campaign.code}</code>
                <button
                  type="button"
                  onClick={async () => {
                    await handleCopyCode(campaign.code);
                    setCopiedMobile(true);
                    setTimeout(() => setCopiedMobile(false), 2000);
                  }}
                  className={`${timeLeftMs <= 48 * 3600 * 1000 ? 'bg-white text-red-700 hover:bg-neutral-100' : 'bg-neutral-900 text-white hover:bg-black'} px-3 py-2 rounded text-xs font-medium flex items-center gap-1 transition-colors ${copiedMobile ? 'opacity-80' : ''}`}
                >
                  <Copy className="w-4 h-4" />
                  {copiedMobile ? (locale === 'tr' ? 'Kopyalandı' : 'Copied') : (locale === 'tr' ? 'Kopyala' : 'Copy')}
                </button>
              </div>
            </div>
          </div>
        )}
      </article>
    </PageLayout>
  );
}
