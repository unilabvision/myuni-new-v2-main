'use client';

import React, { useEffect, useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, FileText, Tag, ShoppingBag, Eye, Share2, Info } from 'lucide-react';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';

// Product interface
interface DigitalProduct {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string | null;
  product_type: 'magazine' | 'notes' | 'ebook' | string;
  price: number;
  original_price: number | null;
  is_free: boolean;
  thumbnail_url: string | null;
  shopier_link: string | null;
  product_content: string | null;  // PDF / içerik URL
  brand_name: string | null;
  brand_logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

// Translations
const texts = {
  tr: {
    back: 'Koleksiyona Dön',
    collection: 'Koleksiyon',
    share: 'Paylaş',
    buyNow: 'Satın Al',
    readNow: 'Hemen İncele',
    free: 'Ücretsiz',
    details: 'Ürün Detayları',
    type: 'Ürün Tipi',
    price: 'Fiyat',
    info: 'Açıklama',
    home: 'Ana Sayfa',
    collection: 'Koleksiyon',
    buyError: 'Satın alma linki henüz eklenmemiş.',
    copied: 'Kopyalandı',
    types: {
      magazine: 'Dergi',
      notes: 'Ders Notu',
      ebook: 'E-Kitap'
    }
  },
  en: {
    back: 'Back to Collection',
    share: 'Share',
    buyNow: 'Buy Now',
    readNow: 'Read Now',
    free: 'Free',
    details: 'Product Details',
    type: 'Product Type',
    price: 'Fiyat',
    info: 'Product Educational Description',
    home: 'Home',
    collection: 'Collection',
    buyError: 'Purchase link is not available yet.',
    copied: 'Kopyalandı',
    providerInfo: 'Sağlayıcı / Marka',
    brand: 'Marka',
    provider: 'Sağlayıcı',
    types: {
      magazine: 'Magazine',
      notes: 'Lecture Note',
      ebook: 'E-Book'
    }
  }
};

export default function CollectionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<DigitalProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedMobile, setCopiedMobile] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);

  const t = texts[locale as keyof typeof texts] || texts.tr;

  const handleShare = async () => {
    // URL'yi dinamik veya canlı adresten bağımsız doğrudan ana domaine bağlarız
    const shareUrl = `https://myunilab.net/${locale}/collection/${product?.slug}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title,
          url: shareUrl
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedMobile(true);
      setTimeout(() => setCopiedMobile(false), 2000);
    }
  };

  // Ürünü ve satın alım durumunu tek seferde yükle
  useEffect(() => {
    async function loadProductAndCheckPurchase() {
      try {
        setLoading(true);
        setCheckingPurchase(true);

        const { data, error } = await supabase
          .from('myuni_products')
          .select('*')
          .eq('is_active', true)
          .eq('slug', slug)
          .single();

        if (error || !data) { notFound(); return; }
        setProduct(data as DigitalProduct);

        // Ürün yüklendikten hemen sonra satın alım kontrolü
        const res = await fetch(`/api/collection/check-purchase?product_id=${data.id}`);
        const json = await res.json();
        if (json.hasPurchased) setHasPurchased(true);

      } catch (err) {
        console.error('Product load error:', err);
        notFound();
      } finally {
        setLoading(false);
        setCheckingPurchase(false);
      }
    }
    loadProductAndCheckPurchase();
  }, [slug]);

  // Ürnü incelemeye gönder (satın alınmış veya ücretsiz)
  const handleView = () => {
    if (product?.product_content) {
      router.push(`/${locale}/collection/${slug}/view`);
    } else {
      alert(locale === 'tr' ? 'Bu ürünün içeriği henüz yüklenmemiştir.' : 'Content not available yet.');
    }
  };

  const getProductIcon = (type: string) => {
    if (type === 'magazine') return <BookOpen className="w-5 h-5 text-neutral-500" />;
    if (type === 'notes') return <FileText className="w-5 h-5 text-neutral-500" />;
    if (type === 'ebook') return <BookOpen className="w-5 h-5 text-neutral-500" />;
    return <Tag className="w-5 h-5 text-neutral-500" />;
  };

  const handleBuy = () => {
    if (product?.is_free) {
      handleView();
    } else if (product?.shopier_link) {
      window.open(product.shopier_link, '_blank', 'noopener,noreferrer');
    } else {
      alert(t.buyError);
    }
  };

  const calculateDiscount = (original: number | null, current: number) => {
    if (!original || original <= current) return null;
    return Math.round(((original - current) / original) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 pt-24 pb-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-900 pb-24">
      <article>
        {/* HERO SECTION */}
        <div className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
            
            <Link 
              href={`/${locale}/collection`}
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.back}
            </Link>

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
              {/* Product Image */}
              <div className="w-full lg:w-1/3 shrink-0">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border border-gray-100 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-900">
                  {product.thumbnail_url ? (
                    <Image
                      src={product.thumbnail_url}
                      alt={product.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-300 dark:text-neutral-600">
                      <BookOpen size={64} />
                    </div>
                  )}
                </div>
              </div>

              {/* Product Info Setup */}
              <div className="w-full lg:w-2/3 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium flex items-center shadow-sm">
                    {getProductIcon(product.product_type)}
                    <span className="ml-2">{t.types[product.product_type as keyof typeof t.types] || product.product_type}</span>
                  </div>
                </div>

                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                  {product.title}
                </h1>

                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                  {product.short_description || product.description}
                </p>

                  {/* Fiyat + Butonlar */}
                  <div className="flex flex-wrap items-center gap-4 border-t border-gray-100 dark:border-neutral-700 pt-8 mt-auto">
                    <div className="flex flex-col mr-auto">
                      {product.original_price && product.original_price > product.price && !product.is_free && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-gray-400 dark:text-gray-500 line-through text-lg font-medium">
                            ₺{product.original_price}
                          </span>
                          <span className="bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 px-2 py-0.5 rounded text-xs font-bold shadow-sm">
                            %{calculateDiscount(product.original_price, product.price)} {locale === 'tr' ? 'İndirim' : 'OFF'}
                          </span>
                        </div>
                      )}
                      <div className="text-3xl font-bold text-neutral-900 dark:text-white flex items-center">
                        {product.is_free ? t.free : `₺${product.price}`}
                      </div>
                    </div>

                    <button
                      onClick={handleShare}
                      className="flex items-center justify-center bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-700 px-6 py-3 rounded-xl font-medium transition-colors"
                    >
                      <Share2 className="w-5 h-5 mr-2" />
                      {copiedMobile ? t.copied : t.share}
                    </button>

                    {/* Kontrol bitene kadar skeleton göster */}
                    {checkingPurchase ? (
                      <div className="w-36 h-12 bg-gray-200 dark:bg-neutral-700 rounded-xl animate-pulse" />
                    ) : (hasPurchased || product.is_free) ? (
                      <button
                        onClick={handleView}
                        className="flex items-center justify-center bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
                      >
                        <Eye className="w-5 h-5 mr-2" />
                        {locale === 'tr' ? 'Ürünü İncele' : 'View Product'}
                      </button>
                    ) : (
                      <button
                        onClick={handleBuy}
                        className="flex items-center justify-center bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
                      >
                        <ShoppingBag className="w-5 h-5 mr-2" />
                        {t.buyNow}
                      </button>
                    )}
                  </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT & DETAILS */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left: Description Content Markdown */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <Info className="w-6 h-6 mr-3 text-primary" />
                {t.info}
              </h2>
              <div className="prose prose-lg prose-neutral dark:prose-invert max-w-none prose-img:rounded-xl">
                {product.description ? (
                  <ReactMarkdown>
                    {product.description}
                  </ReactMarkdown>
                ) : (
                  <p>Ayrıntılı açıklama girilmemiştir.</p>
                )}
              </div>
            </div>

            {/* Right Sidebar: Details */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">

                {/* Ürün Detayları Kartı */}
                <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-neutral-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-neutral-700 pb-4">
                    {t.details}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-neutral-700/50">
                      <span className="text-gray-500 dark:text-gray-400">{t.type}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {t.types[product.product_type as keyof typeof t.types] || product.product_type}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-neutral-700/50">
                      <span className="text-gray-500 dark:text-gray-400">{t.price}</span>
                      <span className="font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                         {product.original_price && product.original_price > product.price && !product.is_free && (
                           <span className="text-gray-400 line-through text-sm">₺{product.original_price}</span>
                         )}
                        {product.is_free ? t.free : `₺${product.price}`}
                      </span>
                    </div>

                    {product.product_info && Object.entries(product.product_info).map(([key, value]) => {
                      if (key.toLowerCase() === 'brand' || key.toLowerCase() === 'provider' || key.toLowerCase() === 'marka' || key.toLowerCase() === 'sağlayıcı') return null;
                      return (
                        <div key={key} className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-neutral-700/50">
                          <span className="text-gray-500 dark:text-gray-400 capitalize">{key.replace('_', ' ')}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{String(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Marka Kartı */}
                {product.brand_name && (
                  <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-neutral-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-neutral-700 pb-4">
                      Sağlayıcı & Marka
                    </h3>
                    <div className="flex items-center space-x-4">
                      {product.brand_logo_url ? (
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-200 dark:border-neutral-700 bg-white">
                          <Image
                            src={product.brand_logo_url}
                            alt={product.brand_name}
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
                          <Tag className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <span className="block text-sm text-gray-500 dark:text-gray-400">Ürün Sahibi</span>
                        <span className="block font-semibold text-gray-900 dark:text-white text-base">
                          {product.brand_name}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
            
          </div>
        </div>
      </article>
    </main>
  );
}
