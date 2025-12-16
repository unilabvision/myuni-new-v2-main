'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Gift, 
  UserPlus, 
  Award, 
  Copy, 
  Share2, 
  Clock,
  ChevronDown,
  ChevronUp,
  Calendar,
  Tag,
  ArrowRight,
  Percent,
  Star,
  Users,
  Info,
  X
} from 'lucide-react';
import PageLayout from '@/app/components/layout/PageLayout';

function createSlug(name: string | null | undefined): string {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function stripMarkdown(input: string | null | undefined, maxLength: number = 120): string {
  if (!input || typeof input !== 'string') return '';
  return input
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
    .trim()
    .substring(0, maxLength) + (input.length > maxLength ? '...' : '');
}

interface CampaignGridProps {
  campaigns: Campaign[];
  texts: any;
  copyCampaignCode: (code: string) => void;
  locale: string;
}

const CampaignGrid: React.FC<CampaignGridProps> = ({ campaigns, texts, copyCampaignCode, locale }) => {
  const totalCampaigns = campaigns.length;
  const getLayoutClass = () => {
    if (totalCampaigns === 1) {
      return "grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 max-w-2xl mx-auto";
    } else if (totalCampaigns === 2) {
      return "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8";
    } else if (totalCampaigns === 3) {
      return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6";
    } else {
      return "grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8";
    }
  };

  if (totalCampaigns >= 4) {
    const firstCampaign = campaigns[0];
    const remainingCampaigns = campaigns.slice(1);
    return (
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          <div className="lg:col-span-1">
            <div className="group relative bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 h-[400px] sm:h-[500px] lg:h-[600px]">
              <div className="relative h-full">
                <Image
                  src={firstCampaign.image}
                  alt={firstCampaign.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop&crop=center';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 via-transparent to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-[#990000]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 lg:p-8 group-hover:opacity-0 transition-opacity duration-300">
                  <div className="flex justify-start">
                    {firstCampaign.is_featured && (
                      <div className="bg-[#990000] text-white px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-full shadow-sm">
                        {texts.campaigns.featured}
                      </div>
                    )}
                  </div>
                  <div className="text-white">
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-medium mb-2 sm:mb-4 leading-tight">{firstCampaign.title}</h3>
                    <div className="w-8 sm:w-12 h-px bg-white/60 mb-2 sm:mb-4"></div>
                    <p className="text-sm sm:text-base text-white/90 mb-2 sm:mb-4 leading-relaxed">{stripMarkdown(firstCampaign.description, 200)}</p>
                    {firstCampaign.discount_percentage && (
                      <div className="inline-block bg-green-500 text-white px-3 py-1 sm:px-4 sm:py-2 text-sm sm:text-lg font-medium rounded-full">
                        %{firstCampaign.discount_percentage} {locale === 'tr' ? 'İndirim' : 'Discount'}
                      </div>
                    )}
                  </div>
                </div>
                {firstCampaign.code && (
                  <div className="absolute inset-0 bg-white/95 dark:bg-neutral-800/95 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 sm:p-6 lg:p-8 backdrop-blur-sm">
                    <div className="text-left">
                      <h4 className="text-lg sm:text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-2 sm:mb-4">{locale === 'tr' ? 'Kampanya Kodu' : 'Campaign Code'}</h4>
                      <div className="bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 px-4 py-2 sm:px-6 sm:py-3 mb-4 sm:mb-6 inline-block rounded-lg shadow-sm">
                        <code className="font-mono text-lg sm:text-2xl font-bold">{firstCampaign.code}</code>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyCampaignCode(firstCampaign.code!);
                        }}
                        className="bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-300 flex items-center rounded-lg shadow-sm w-full sm:w-auto"
                      >
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        {texts.campaigns.copyCode}
                      </button>
                    </div>
                    <div className="mt-auto">
                      <Link
                        href={`/${locale}/campaigns/${firstCampaign.campaign_slug || createSlug(firstCampaign.title)}`}
                        className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-100 text-neutral-900 dark:text-neutral-100 px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-300 flex items-center justify-center rounded-lg shadow-sm w-full"
                      >
                        {texts.campaigns.learnMore}
                        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-6 h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden">
              {remainingCampaigns.slice(0, 3).map((campaign) => (
                <div
                  key={campaign.id}
                  className="group relative bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 h-[120px] sm:h-[150px] lg:h-[180px]"
                >
                  <div className="relative h-full">
                    <Image
                      src={campaign.image}
                      alt={campaign.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop&crop=center';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 via-transparent to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#990000]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute inset-0 flex flex-col justify-between p-3 sm:p-4 lg:p-6 group-hover:opacity-0 transition-opacity duration-300">
                      <div className="flex justify-end"></div>
                      <div className="text-white">
                        <h3 className="text-sm sm:text-base lg:text-lg font-medium mb-1 sm:mb-2 leading-tight">{campaign.title}</h3>
                        <p className="text-xs sm:text-sm text-white/90 line-clamp-2 leading-relaxed">{stripMarkdown(campaign.description, 80)}</p>
                      </div>
                    </div>
                    {campaign.code && (
                      <div className="absolute inset-0 bg-white/95 dark:bg-neutral-800/95 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-2 sm:p-3 lg:p-4 backdrop-blur-sm">
                        <div className="text-left">
                            <h4 className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1 sm:mb-2">{locale === 'tr' ? 'Kampanya Kodu' : 'Campaign Code'}</h4>
                          <div className="bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 px-2 py-1 sm:px-3 sm:py-2 mb-2 sm:mb-3 inline-block rounded shadow-sm">
                            <code className="font-mono text-xs sm:text-sm font-bold">{campaign.code}</code>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyCampaignCode(campaign.code!);
                            }}
                            className="bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white px-2 py-1 sm:px-3 sm:py-2 text-xs font-medium transition-all duration-300 flex items-center rounded shadow-sm w-full sm:w-auto"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            {texts.campaigns.copyCode}
                          </button>
                        </div>
                        <div className="mt-auto">
                          {campaign.title && (
                            <Link
                              href={`/${locale}/campaigns/${campaign.campaign_slug || createSlug(campaign.title)}`}
                              className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-100 text-neutral-900 dark:text-neutral-100 px-3 py-1 sm:px-4 sm:py-2 text-xs font-medium transition-all duration-300 flex items-center justify-center rounded shadow-sm w-full"
                            >
                              {texts.campaigns.learnMore}
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {totalCampaigns >= 5 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {remainingCampaigns.slice(3).map((campaign) => (
              <div
                key={campaign.id}
                className="group relative bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 h-[250px] sm:h-[300px] lg:h-[350px]"
              >
                <div className="relative h-full">
                  <Image
                    src={campaign.image}
                    alt={campaign.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop&crop=center';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 via-transparent to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#990000]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-5 lg:p-6 group-hover:opacity-0 transition-opacity duration-300">
                    <div className="flex justify-between items-start">
                      {campaign.is_featured && (
                        <div className="bg-[#990000] text-white px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-full shadow-sm">
                          {texts.campaigns.featured}
                        </div>
                      )}
                    </div>
                    <div className="text-white">
                      <h3 className="text-lg sm:text-xl font-medium mb-2 sm:mb-4 leading-tight">{campaign.title}</h3>
                      <div className="w-8 sm:w-12 h-px bg-white/60 mb-2 sm:mb-4"></div>
                      <p className="text-xs sm:text-sm text-white/90 mb-2 sm:mb-4 line-clamp-2 leading-relaxed">{stripMarkdown(campaign.description, 100)}</p>
                    </div>
                  </div>
                  {campaign.code && (
                    <div className="absolute inset-0 bg-white/95 dark:bg-neutral-800/95 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 sm:p-5 lg:p-6 backdrop-blur-sm">
                      <div className="text-left">
                        <h4 className="text-sm sm:text-base font-medium text-neutral-900 dark:text-neutral-100 mb-2 sm:mb-4">{locale === 'tr' ? 'Kampanya Kodu' : 'Campaign Code'}</h4>
                        <div className="bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 px-3 py-2 sm:px-5 sm:py-3 mb-3 sm:mb-4 inline-block rounded-lg shadow-sm">
                          <code className="font-mono text-sm sm:text-base font-bold">{campaign.code}</code>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyCampaignCode(campaign.code!);
                          }}
                          className="bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white px-3 py-2 sm:px-5 sm:py-3 text-xs font-medium transition-all duration-300 flex items-center rounded-lg shadow-sm w-full sm:w-auto"
                        >
                          <Copy className="w-3 h-3 mr-1 sm:mr-2" />
                          {texts.campaigns.copyCode}
                        </button>
                      </div>
                      <div className="mt-auto">
                        {campaign.title && (
                          <Link
                            href={`/${locale}/campaigns/${campaign.campaign_slug || createSlug(campaign.title)}`}
                            className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-100 text-neutral-900 dark:text-neutral-100 px-4 py-2 sm:px-6 sm:py-3 text-xs font-medium transition-all duration-300 flex items-center justify-center rounded-lg shadow-sm w-full"
                          >
                            {texts.campaigns.learnMore}
                            <ArrowRight className="w-3 h-3 ml-1 sm:ml-2" />
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={getLayoutClass()}>
      {campaigns.map((campaign) => {
        const isLarge = totalCampaigns <= 2;
        const cardHeight = isLarge ? "h-[300px] sm:h-[400px] lg:h-[500px]" : "h-[250px] sm:h-[300px] lg:h-[350px]";
        const titleSize = isLarge ? "text-lg sm:text-xl lg:text-2xl" : "text-base sm:text-lg lg:text-xl";
        const padding = isLarge ? "p-4 sm:p-6 lg:p-8" : "p-3 sm:p-4 lg:p-6";
        return (
          <div
            key={campaign.id}
            className={`group relative bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 ${cardHeight}`}
          >
            <div className="relative h-full">
              <Image
                src={campaign.image}
                alt={campaign.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop&crop=center';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-[#990000]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className={`absolute inset-0 flex flex-col justify-between ${padding} group-hover:opacity-0 transition-opacity duration-300`}>
                <div className="flex justify-between items-start">
                  {campaign.is_featured && (
                    <div className="bg-[#990000] text-white px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-full shadow-sm">
                      {texts.campaigns.featured}
                    </div>
                  )}
                </div>
                <div className="text-white">
                  <h3 className={`${titleSize} font-medium mb-2 sm:mb-4 leading-tight`}>{campaign.title}</h3>
                  <div className="w-8 sm:w-12 h-px bg-white/60 mb-2 sm:mb-4"></div>
                  <p className="text-xs sm:text-sm text-white/90 mb-2 sm:mb-4 line-clamp-2 leading-relaxed">{stripMarkdown(campaign.description, 100)}</p>
                  {campaign.discount_percentage && isLarge && (
                    <div className="inline-block bg-green-500 text-white px-3 py-1 sm:px-4 sm:py-2 text-sm sm:text-base font-medium rounded-full">
                      %{campaign.discount_percentage} {locale === 'tr' ? 'İndirim' : 'Discount'}
                    </div>
                  )}
                </div>
              </div>
              {campaign.code && (
                <div className={`absolute inset-0 bg-white/95 dark:bg-neutral-800/95 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between ${padding} backdrop-blur-sm`}>
                  <div className="text-left">
                    <h4 className={`${isLarge ? 'text-base sm:text-lg' : 'text-sm sm:text-base'} font-medium text-neutral-900 dark:text-neutral-100 mb-2 sm:mb-4`}>{locale === 'tr' ? 'Kampanya Kodu' : 'Campaign Code'}</h4>
                    <div className="bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 px-3 py-2 sm:px-5 sm:py-3 mb-3 sm:mb-4 inline-block rounded-lg shadow-sm">
                      <code className={`font-mono ${isLarge ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'} font-bold`}>
                        {campaign.code}
                      </code>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyCampaignCode(campaign.code!);
                      }}
                      className={`bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white px-3 py-2 sm:px-5 sm:py-3 ${isLarge ? 'text-xs sm:text-sm' : 'text-xs'} font-medium transition-all duration-300 flex items-center rounded-lg shadow-sm w-full sm:w-auto`}
                    >
                      <Copy className={`${isLarge ? 'w-3 h-3 sm:w-4 sm:h-4' : 'w-3 h-3'} mr-1 sm:mr-2`} />
                      {texts.campaigns.copyCode}
                    </button>
                  </div>
                  <div className="mt-auto">
                    {campaign.title && (
                      <Link
                        href={`/${locale}/campaigns/${campaign.campaign_slug || createSlug(campaign.title)}`}
                        className={`bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-100 text-neutral-900 dark:text-neutral-100 px-4 py-2 sm:px-6 sm:py-3 ${isLarge ? 'text-xs sm:text-sm' : 'text-xs'} font-medium transition-all duration-300 flex items-center justify-center rounded-lg shadow-sm w-full`}
                      >
                        {texts.campaigns.learnMore}
                        <ArrowRight className={`${isLarge ? 'w-3 h-3 sm:w-4 sm:h-4' : 'w-3 h-3'} ml-1 sm:ml-2`} />
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  earnedDiscounts: number;
  pendingReferrals: number;
}

interface RewardCode {
  id: string;
  code: string;
  discount_amount: number;
  is_used: boolean;
  valid_until: string;
  created_at: string;
}

interface Campaign {
  id: string;
  title: string;
  description: string;
  type: 'discount' | 'special' | 'event' | 'bundle';
  discount_percentage?: number;
  discount_amount?: number;
  code?: string;
  valid_until: string;
  image: string;
  is_featured: boolean;
  is_active: boolean;
  category: string;
  usage_count?: number;
  max_usage?: number;
  campaign_name?: string;
  campaign_description?: string;
  created_at?: string;
  discount_type?: string;
  applicable_courses?: string[];
  campaign_slug?: string | null;
}

const texts = {
  tr: {
    title: "Kampanyalar",
    subtitle: "Özel indirimler ve kampanyalar ile eğitimlerinizi uygun fiyatlarla alın!",
    referral: {
      title: "Arkadaşlarını Davet Et, İndirim Kazan!",
      subtitle: "Kodunla kurs aldığında %15 indirim kodu kazanırsın.",
      yourCode: "Davet Kodun",
      copyCode: "Kodu Kopyala",
      shareCode: "Kodu Paylaş",
      createCode: "Davet Kodu Oluştur",
      codeNote: "Bu kod senin kimliğin gibi, her zaman aynı kalacak",
      createNote: "Referans kodun oluşturulacak ve bir daha değişmeyecek",
      howItWorks: "Nasıl Çalışır?",
      step1: "Referans kodunu arkadaşlarınla paylaş ve onlara nasıl kullanacaklarını anlat",
      step2: "Arkadaşın kendi istediği herhangi bir kursu seçsin ve satın alma sayfasına gitsin",
      step3: "Arkadaşın satın alma işlemini tamamladığında sen otomatik olarak %15 indirim kodu kazanırsın!",
      stats: {
        totalReferrals: "Toplam Davet",
        earnedRewards: "Kazanılan İndirim",
        availableRewards: "Kullanılabilir İndirim"
      },
      rewardCodes: {
        title: "İndirim Kodlarım",
        used: "Kullanıldı",
        available: "Kullanılabilir",
        expired: "Süresi Doldu"
      },
      messages: {
        codeCreated: "Referans kodu oluşturuldu!",
        codeCopied: "Referans kodu kopyalandı!",
        createError: "Referans kodu oluşturulamadı",
        loadError: "Veriler yüklenemedi"
      },
      infoPopup: {
        title: "Referans Sistemi",
        description: "Arkadaşlarını davet ederek indirim kazanmanın kolay yolu:",
        steps: [
          "Referans kodunu arkadaşlarınla paylaş ve onlara nasıl kullanacaklarını anlat",
          "Arkadaşın kendi istediği herhangi bir kursu seçsin ve satın alma sayfasına gitsin", 
          "Arkadaşın satın alma işlemini tamamladığında sen otomatik olarak %15 indirim kodu kazanırsın!",
          "Kazandığın indirim kodlarını dilediğin gibi almak istediğin kurslarda kullan!"
        ],
        benefits: [
          "%15 indirim kodu",
          "Sınırsız davet",
          "Kodlar 3 gün geçerli",
          "Tüm kurslarda kullanılabilir"
        ],
        closeButton: "Anladım"
      }
    },
    campaigns: {
      featured: "Öne Çıkan",
      all: "Tüm Kampanyalar",
      discount: "İndirim",
      special: "Özel",
      event: "Etkinlik",
      bundle: "Paket",
      corporate: "Kurumsal",
      copyCode: "Kodu Kopyala",
      validUntil: "Geçerlilik",
      useNow: "Hemen Kullan",
      learnMore: "Detayları Gör",
      noCampaigns: "Henüz aktif kampanya yok",
      noCampaignsDesc: "Yeni kampanyalar için takipte kalın!"
    },
    loading: "Yükleniyor...",
    error: "Veri yüklenirken bir hata oluştu"
  },
  en: {
    title: "Campaigns",
    subtitle: "Get your education at special prices with our exclusive campaigns and discounts!",
    referral: {
      title: "Refer Friends, Earn Discounts!",
      subtitle: "When your friends purchase courses with your referral code, you earn 15% discount codes",
      yourCode: "Your Referral Code",
      copyCode: "Copy Code",
      shareCode: "Share Code",
      createCode: "Create Referral Code",
      codeNote: "This code is like your identity, it will always stay the same",
      createNote: "Your referral code will be created and never change",
      howItWorks: "How It Works?",
      step1: "Share your referral code with friends",
      step2: "Friend selects any course they want and goes to checkout page",
      step3: "When your friend completes the purchase, you earn 15% discount code!",
      stats: {
        totalReferrals: "Total Referrals",
        earnedRewards: "Earned Discounts",
        availableRewards: "Available Discounts"
      },
      rewardCodes: {
        title: "Your Discount Codes",
        used: "Used",
        available: "Available",
        expired: "Expired"
      },
      messages: {
        codeCreated: "Referral code created!",
        codeCopied: "Referral code copied!",
        createError: "Failed to create referral code",
        loadError: "Failed to load data"
      },
      infoPopup: {
        title: "How Does the Referral System Work?",
        description: "The easy way to earn discounts by inviting friends:",
        steps: [
          "Share your referral code with friends",
          "Friend selects any course they want and goes to checkout page",
          "When your friend completes the purchase, you earn 15% discount code!",
          "Use your earned discount codes anytime"
        ],
        benefits: [
          "15% discount code for each successful referral",
          "Unlimited referrals you can send",
          "Codes valid for 3 days",
          "Can be used on all courses"
        ],
        closeButton: "Got it"
      }
    },
    campaigns: {
      featured: "Featured",
      all: "All Campaigns",
      discount: "Discount",
      special: "Special",
      event: "Event",
      bundle: "Bundle",
      corporate: "Corporate",
      copyCode: "Copy Code",
      validUntil: "Valid Until",
      useNow: "Use Now",
      learnMore: "Learn More",
      noCampaigns: "No active campaigns",
      noCampaignsDesc: "Stay tuned for new campaigns!"
    },
    loading: "Loading...",
    error: "An error occurred while loading data"
  }
};

export default function CampaignsPage() {
  const [loading, setLoading] = useState(true);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    totalReferrals: 0,
    successfulReferrals: 0,
    earnedDiscounts: 0,
    pendingReferrals: 0
  });
  const [rewardCodes, setRewardCodes] = useState<RewardCode[]>([]);
  const [referralLoading, setReferralLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [referralExpanded, setReferralExpanded] = useState(true);
  const [rewardCodesExpanded, setRewardCodesExpanded] = useState(true);
  const [showReferralInfoPopup, setShowReferralInfoPopup] = useState(false);
  const { user } = useUser();
  const params = useParams();
  const userId = user?.id;
  const locale = params?.locale || 'en';
  const t = texts[locale as keyof typeof texts] || texts.en;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCampaigns = useCallback(async () => {
    try {
      setCampaignsLoading(true);
      setError(null);
      const response = await fetch(`/api/campaigns?locale=${locale}`);
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.data);
      } else {
        setError(data.error || 'Failed to load campaigns');
      }
    } catch (error) {
      setError('Failed to load campaigns');
    } finally {
      setCampaignsLoading(false);
    }
  }, [locale]);

  const fetchReferralData = useCallback(async () => {
    if (!userId) return;
    try {
      setReferralLoading(true);
      const [codeResponse, statsResponse, rewardsResponse] = await Promise.all([
        fetch('/api/referral?action=code'),
        fetch('/api/referral?action=stats'),
        fetch('/api/referral?action=rewards')
      ]);
      const codeData = await codeResponse.json();
      const statsData = await statsResponse.json();
      const rewardsData = await rewardsResponse.json();
      if (codeData.success && codeData.data.code) {
        setReferralCode(codeData.data.code);
      } else {
        setReferralCode(null);
      }
      if (statsData.success) {
        setReferralStats(statsData.data);
      }
      if (rewardsData.success) {
        setRewardCodes(rewardsData.data);
      }
    } catch (error) {
    } finally {
      setReferralLoading(false);
    }
  }, [userId]);

  const createReferralCode = async () => {
    if (!userId) return;
    try {
      setReferralLoading(true);
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' })
      });
      const data = await response.json();
      if (data.success) {
        setReferralCode(data.code);
        showToast(t.referral.messages.codeCreated, 'success');
      } else {
        showToast(t.referral.messages.createError + ': ' + data.error, 'error');
      }
    } catch (error) {
      showToast(t.referral.messages.createError, 'error');
    } finally {
      setReferralLoading(false);
    }
  };

  const copyReferralCode = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      showToast(t.referral.messages.codeCopied, 'success');
    } catch (error) {
    }
  };

  const shareReferralCode = () => {
    if (!referralCode) return;
    const shareText = `Referans kodumu kullanın: ${referralCode} - ${locale === 'tr' ? 'MyUNI kurslarında %15 indirim kazanın!' : 'Get 15% discount on MyUNI courses!'}`;
    const shareUrl = `https://myunilab.net/${locale}/kurs?ref=${referralCode}`;
    if (navigator.share) {
      navigator.share({
        title: 'MyUNI Referans Kodum',
        text: shareText,
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      showToast(t.referral.messages.codeCopied, 'success');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (!campaign.is_active) return false;
    if (showFeaturedOnly && !campaign.is_featured) return false;
    if (activeFilter !== 'all' && campaign.type !== activeFilter) return false;
    return true;
  });

  const copyCampaignCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast(locale === 'tr' ? 'Kopyalandı!' : 'Copied!', 'success');
    } catch (error) {
    }
  };

  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case 'discount':
        return <Percent className="w-4 h-4" />;
      case 'special':
        return <Star className="w-4 h-4" />;
      case 'event':
        return <Calendar className="w-4 h-4" />;
      case 'bundle':
        return <Gift className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  useEffect(() => {
    fetchCampaigns();
    if (userId) {
      fetchReferralData();
    }
    setLoading(false);
  }, [userId, fetchReferralData, fetchCampaigns]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{t.error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
          >
            {locale === 'tr' ? 'Tekrar Dene' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      title={t.title}
      description={t.subtitle}
      locale={locale as string}
      breadcrumbs={[
        { name: locale === 'tr' ? 'Kampanyalar' : 'Campaigns', href: `/${locale}/campaigns` }
      ]}
      variant="minimal"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-8">
        <div className="mb-16">
          {campaignsLoading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-4 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neutral-600 dark:text-neutral-400">{t.loading}</p>
            </div>
          ) : (
            <CampaignGrid 
              campaigns={filteredCampaigns}
              texts={t}
              copyCampaignCode={copyCampaignCode}
              locale={locale as string}
            />
          )}
        </div>

        {userId && (
          <div className="mb-6 sm:mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div 
                  onClick={() => setReferralExpanded(!referralExpanded)}
                  className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                        <Gift className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                          {t.referral.title}
                        </h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {t.referral.subtitle}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
                        <div className="flex items-center gap-1">
                          <UserPlus className="w-4 h-4" />
                          <span>{referralStats.totalReferrals}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          <span>{rewardCodes.filter(code => !code.is_used && new Date(code.valid_until) > new Date()).length}</span>
                        </div>
                      </div>
                      <div className={`transform transition-transform duration-200 ${referralExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-4 h-4 text-neutral-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {referralExpanded && (
                  <div className="mt-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white dark:bg-neutral-800 rounded-lg p-3 text-center border border-neutral-200 dark:border-neutral-700">
                          <UserPlus className="w-5 h-5 text-neutral-600 dark:text-neutral-400 mx-auto mb-1" />
                          <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{referralStats.totalReferrals}</div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">{t.referral.stats.totalReferrals}</div>
                        </div>
                        <div className="bg-white dark:bg-neutral-800 rounded-lg p-3 text-center border border-neutral-200 dark:border-neutral-700">
                          <Gift className="w-5 h-5 text-neutral-600 dark:text-neutral-400 mx-auto mb-1" />
                          <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{referralStats.earnedDiscounts}</div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">{t.referral.stats.earnedRewards}</div>
                        </div>
                        <div className="bg-white dark:bg-neutral-800 rounded-lg p-3 text-center border border-neutral-200 dark:border-neutral-700">
                          <Award className="w-5 h-5 text-neutral-600 dark:text-neutral-400 mx-auto mb-1" />
                          <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                            {rewardCodes.filter(code => !code.is_used && new Date(code.valid_until) > new Date()).length}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">{t.referral.stats.availableRewards}</div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                        {referralCode ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <code className="flex-1 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded px-3 py-2 font-mono text-sm min-w-0">
                                {referralCode}
                              </code>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={copyReferralCode}
                                className="flex items-center gap-2 px-3 py-2 text-sm bg-neutral-900 dark:bg-neutral-600 text-white rounded hover:bg-neutral-800 dark:hover:bg-neutral-500 transition-colors"
                                title={t.referral.copyCode}
                              >
                                <Copy className="w-4 h-4" />
                                <span className="hidden sm:inline">{t.referral.copyCode}</span>
                              </button>
                              <button
                                onClick={shareReferralCode}
                                className="flex items-center gap-2 px-3 py-2 text-sm bg-neutral-700 dark:bg-neutral-500 text-white rounded hover:bg-neutral-600 dark:hover:bg-neutral-400 transition-colors"
                                title={t.referral.shareCode}
                              >
                                <Share2 className="w-4 h-4" />
                                <span className="hidden sm:inline">{t.referral.shareCode}</span>
                              </button>
                              <button
                                onClick={() => setShowReferralInfoPopup(true)}
                                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                title={locale === 'tr' ? 'Nasıl kullanılır?' : 'How to use?'}
                              >
                                <Info className="w-4 h-4" />
                                <span className="hidden sm:inline">{locale === 'tr' ? 'Nasıl kullanılır?' : 'How to use?'}</span>
                              </button>
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {t.referral.codeNote}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <button
                              onClick={createReferralCode}
                              disabled={referralLoading}
                              className="flex items-center gap-2 px-4 py-2 text-sm bg-neutral-900 dark:bg-neutral-600 text-white rounded hover:bg-neutral-800 dark:hover:bg-neutral-500 transition-colors disabled:opacity-50"
                            >
                              {referralLoading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Gift className="w-4 h-4" />
                                  {t.referral.createCode}
                                </>
                              )}
                            </button>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {t.referral.createNote}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div 
                  onClick={() => setRewardCodesExpanded(!rewardCodesExpanded)}
                  className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                        <Award className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                          {t.referral.rewardCodes.title}
                        </h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {locale === 'tr' ? 'Kazandığım indirim kodları' : 'Your earned discount codes'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
                        <Award className="w-4 h-4" />
                        <span>{rewardCodes.length}</span>
                      </div>
                      <div className={`transform transition-transform duration-200 ${rewardCodesExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-4 h-4 text-neutral-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {rewardCodesExpanded && (
                  <div className="mt-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                    <div className="p-4">
                      {rewardCodes.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {rewardCodes.map((reward) => {
                            const isExpired = new Date(reward.valid_until) < new Date();
                            const isAvailable = !reward.is_used && !isExpired;
                            return (
                              <div key={reward.id} className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-neutral-100 dark:bg-neutral-700 rounded flex items-center justify-center">
                                      <Award className={`w-3 h-3 ${
                                        reward.is_used 
                                          ? 'text-gray-400'
                                          : isExpired
                                          ? 'text-red-400'
                                          : 'text-green-500'
                                      }`} />
                                    </div>
                                    <span className="text-sm font-mono text-neutral-900 dark:text-neutral-100">
                                      {reward.code}
                                    </span>
                                  </div>
                                  <span className="text-xs font-mono bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 px-2 py-1 rounded">
                                    %{reward.discount_amount}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(reward.valid_until)}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    reward.is_used 
                                      ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                      : isExpired
                                      ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                      : 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                  }`}>
                                    {reward.is_used 
                                      ? t.referral.rewardCodes.used
                                      : isExpired 
                                      ? t.referral.rewardCodes.expired
                                      : t.referral.rewardCodes.available
                                    }
                                  </span>
                                </div>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(reward.code);
                                    showToast(t.referral.messages.codeCopied, 'success');
                                  }}
                                  disabled={!isAvailable}
                                  className={`w-full px-3 py-2 rounded text-xs font-medium transition-colors ${
                                    isAvailable
                                      ? 'bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 cursor-pointer'
                                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                                  }`}
                                >
                                  <Copy className="w-3 h-3 inline mr-1" />
                                  {isAvailable 
                                    ? t.referral.copyCode 
                                    : (reward.is_used 
                                        ? t.referral.rewardCodes.used 
                                        : t.referral.rewardCodes.expired
                                      )
                                  }
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Award className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                            {locale === 'tr' ? 'Henüz indirim kodu kazanmadın' : 'No discount codes earned yet'}
                          </p>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500">
                            {locale === 'tr' ? 'Arkadaşlarını davet etmeye başla!' : 'Start referring friends!'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!userId && (
          <div className="mb-6 sm:mb-8">
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 sm:p-6">
              <div className="max-w-4xl">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-600 dark:text-neutral-400" />
                  </div>
                  <div className="flex-1 w-full">
                    <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2 text-left">
                      {locale === 'tr' ? 'Hesabını Aç, İndirim Kazan!' : 'Create Account, Earn Discounts!'}
                    </h2>
                    <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed text-left">
                      {locale === 'tr' 
                        ? 'Arkadaşlarını davet ederek %15 indirim kodları kazan. Ücretsiz hesap aç, referans sistemini kullanmaya başla!'
                        : 'Earn 15% discount codes by referring friends. Create a free account and start using the referral system!'
                      }
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                      <Link
                        href={`/${locale}/login?tab=signup`}
                        className="inline-flex items-center justify-start gap-2 px-4 py-2 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-medium rounded-lg transition-colors w-full sm:w-auto"
                      >
                        <UserPlus className="w-4 h-4" />
                        {locale === 'tr' ? 'Hesap Aç' : 'Create Account'}
                      </Link>
                      <Link
                        href={`/${locale}/login`}
                        className="inline-flex items-center justify-start gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-medium rounded-lg transition-colors w-full sm:w-auto"
                      >
                        <Gift className="w-4 h-4" />
                        {locale === 'tr' ? 'Giriş Yap' : 'Login'}
                      </Link>
                    </div>
                    <div className="mt-4 flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                      <div className="flex items-center justify-start gap-2">
                        <Gift className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{locale === 'tr' ? 'Ücretsiz Hesap' : 'Free Account'}</span>
                      </div>
                      <div className="flex items-center justify-start gap-2">
                        <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{locale === 'tr' ? '%15 İndirim' : '15% Discount'}</span>
                      </div>
                      <div className="flex items-center justify-start gap-2">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{locale === 'tr' ? 'Sınırsız Davet' : 'Unlimited Referrals'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className={`px-4 py-2 rounded-lg text-white ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {toast.message}
            </div>
          </div>
        )}

        {showReferralInfoPopup && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowReferralInfoPopup(false);
              }
            }}
          >
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                        {t.referral.infoPopup.title}
                      </h3>
                      <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                        {t.referral.infoPopup.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowReferralInfoPopup(false)}
                    className="p-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-neutral-500" />
                  </button>
                </div>

                <div className="space-y-6">
                  {t.referral.infoPopup.steps.map((step: string, index: number) => (
                    <div key={index} className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                      <div className="flex items-start gap-4 p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
                        <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-base text-neutral-700 dark:text-neutral-300 font-medium mb-3">
                            {step}
                          </p>
                          <div className="mt-3">
                            {index === 0 && (
                              <div className="relative w-full bg-neutral-100 dark:bg-neutral-600 rounded border border-neutral-300 dark:border-neutral-500 overflow-hidden">
                                <Image
                                  src="https://emfvwpztyuykqtepnsfp.supabase.co/storage/v1/object/public/myunilab/Campaign/kodu%20kopyala.webp"
                                  alt={locale === 'tr' ? 'Adım 1: Kodu Kopyala' : 'Step 1: Copy Code'}
                                  width={400}
                                  height={200}
                                  className="w-full h-auto object-cover"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                              </div>
                            )}
                            {index === 1 && (
                              <div className="relative w-full bg-neutral-100 dark:bg-neutral-600 rounded border border-neutral-300 dark:border-neutral-500 overflow-hidden">
                                <Image
                                  src="https://emfvwpztyuykqtepnsfp.supabase.co/storage/v1/object/public/myunilab/Campaign/Screenshot%202025-09-27%20at%2016.17.23.webp"
                                  alt={locale === 'tr' ? 'Adım 2: Arkadaşın Kurs Satın Alıyor' : 'Step 2: Friend Purchases Course'}
                                  width={400}
                                  height={200}
                                  className="w-full h-auto object-cover"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                              </div>
                            )}
                            {index === 2 && (
                              <div className="relative w-full bg-neutral-100 dark:bg-neutral-600 rounded border border-neutral-300 dark:border-neutral-500 overflow-hidden">
                                <Image
                                  src="https://emfvwpztyuykqtepnsfp.supabase.co/storage/v1/object/public/myunilab/Campaign/Screenshot%202025-09-27%20at%2016.21.37.webp"
                                  alt={locale === 'tr' ? 'Adım 3: Arkadaşın Satın Alma Sayfasında Kodu Giriyor' : 'Step 3: Friend Enters Code on Checkout Page'}
                                  width={400}
                                  height={200}
                                  className="w-full h-auto object-cover"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                              </div>
                            )}
                            {index === 3 && (
                              <div className="relative w-full bg-neutral-100 dark:bg-neutral-600 rounded border border-neutral-300 dark:border-neutral-500 overflow-hidden">
                                <Image
                                  src="https://emfvwpztyuykqtepnsfp.supabase.co/storage/v1/object/public/myunilab/Campaign/Screenshot%202025-09-27%20at%2016.26.47.webp"
                                  alt={locale === 'tr' ? 'Adım 4: İndirim Kodunu Kullan' : 'Step 4: Use Your Discount Code'}
                                  width={400}
                                  height={200}
                                  className="w-full h-auto object-cover"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <h5 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                          {index === 0 && (locale === 'tr' ? 'Referans Kodunu Paylaş' : 'Share Referral Code')}
                          {index === 1 && (locale === 'tr' ? 'Arkadaşın Kurs Seçsin' : 'Friend Selects Course')}
                          {index === 2 && (locale === 'tr' ? 'Satın Alma İşlemi' : 'Purchase Process')}
                          {index === 3 && (locale === 'tr' ? 'İndirim Kodunu Kullan' : 'Use Your Discount Code')}
                        </h5>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          {index === 0 && (locale === 'tr' 
                            ? 'Referans kodunu arkadaşlarınla paylaş. Bu kod senin kimliğin gibi, her zaman aynı kalacak. Arkadaşlarına nasıl kullanacaklarını da anlat.'
                            : 'Share your referral code with friends. This code is like your identity and will always stay the same. Explain to your friends how to use it.'
                          )}
                          {index === 1 && (locale === 'tr' 
                            ? 'Arkadaşın istediği herhangi bir kursu seçsin ve satın alma sayfasına gitsin.'
                            : 'Your friend selects any course they want and goes to the checkout page.'
                          )}
                          {index === 2 && (locale === 'tr' 
                            ? 'Arkadaşın satın alma sayfasında referans kodunu girer ve işlemi tamamlar. Sen 15% indirim kodu kazanırsın.'
                            : 'Your friend enters the referral code at checkout and completes the purchase. You earn a 15% discount code.'
                          )}
                          {index === 3 && (locale === 'tr' 
                            ? 'Kazandığın indirim kodunu dilediğin kurslarda kullanabilirsin. Kodlar 3 gün geçerlidir.'
                            : 'Use your earned discount code on any course you like. Codes are valid for 3 days.'
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}



