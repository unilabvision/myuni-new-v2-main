'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { BookOpen, FileText, Download, Filter, Search, Tag, ArrowRight, ShoppingBag } from 'lucide-react';

// Tip Tanımlamaları
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
  thumbnail_url: string;
  is_active: boolean;
  created_at: string;
}

// Çeviri Metinleri
const texts = {
  tr: {
    hero: {
      badge: "MyUNI dijital koleksiyonu",
      title: "Özenle hazırlanmış dijital ürünlerimizle gelişiminizi hızlandırın.",
      subtitle: "Ders notları, özel dergiler ve e-kitaplar... Pratik deneyimlerle desteklenen koleksiyonumuza göz atıp dilediğinizi anında incelemeye başlayın.",
      stats: [
        { value: "50+", label: "Dergi" },
        { value: "500+", label: "Ders Notu" },
        { value: "100+", label: "E-Kitap" }
      ],
      exploreTarget: "Tüm Ürünleri İncele",
      featuredTitle: "Öne Çıkan Ürünler",
      buyNow: "Hemen İncele",
    },
    filterParams: {
      title: "Tüm Koleksiyon",
      searchPlaceholder: "Ürün ara...",
      filters: {
        all: "Tümü",
        magazine: "Dergiler",
        notes: "Ders Notları",
        ebook: "E-Kitaplar",
      },
      free: "Ücretsiz",
      buyNow: "Satın Al",
      noProducts: "Aramanıza uygun dijital ürün bulunamadı.",
      loading: "Koleksiyon yükleniyor..."
    }
  },
  en: {
    hero: {
      badge: "MyUNI digital collection",
      title: "Accelerate your growth with our carefully crafted digital assets.",
      subtitle: "Lecture notes, exclusive magazines, and e-books... Check out our practical collections and start reading instantly.",
      stats: [
        { value: "50+", label: "Magazines" },
        { value: "500+", label: "Notes" },
        { value: "100+", label: "E-Books" }
      ],
      exploreTarget: "Explore All Products",
      featuredTitle: "Featured Products",
      buyNow: "View Now",
    },
    filterParams: {
      title: "Full Collection",
      searchPlaceholder: "Search products...",
      filters: {
        all: "All",
        magazine: "Magazines",
        notes: "Lecture Notes",
        ebook: "E-Books",
      },
      free: "Free",
      buyNow: "Buy Now",
      noProducts: "No digital products found for your search.",
      loading: "Loading collection..."
    }
  }
};

export default function CollectionPage() {
  const params = useParams();
  const locale = params?.locale as 'tr' | 'en' || 'tr';
  const t = texts[locale] || texts.tr;
  const router = useRouter();

  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  
  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);

  // Ürünleri ve satın alımları paralel olarak yükle (flicker/gecikmeyi önlemek için)
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // İki isteği aynı anda paralel başlat
        const productsPromise = supabase
          .from('myuni_products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        const purchasesPromise = fetch('/api/collection/my-purchases')
          .then(res => res.json())
          .catch(err => {
            console.error('Purchases fetch failed:', err);
            return { purchasedIds: [] };
          });

        const [productsResult, purchasesResult] = await Promise.all([
          productsPromise,
          purchasesPromise
        ]);

        if (productsResult.error) {
          console.error("Ürünler çekilirken hata oluştu:", productsResult.error);
        } else {
          setProducts(productsResult.data || []);
        }

        if (purchasesResult.purchasedIds) {
          setPurchasedIds(new Set(purchasesResult.purchasedIds));
        }
      } catch (err) {
        console.error("Beklenmeyen hata:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Varsayılan olarak en son eklenenleri "Öne Çıkan" kabul et veya spesifik is_featured eklenebilir. Şimdilik ilk 3'ü:
  const featuredProducts = products.slice(0, 3);
  
  useEffect(() => {
    if (featuredProducts.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % featuredProducts.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [featuredProducts.length]);

  // Filtreleme Mantığı
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (product.short_description && product.short_description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = activeFilter === 'all' || product.product_type === activeFilter;

    return matchesSearch && matchesFilter;
  });

  // İkon Belirleme
  const getProductIcon = (type: string) => {
    if (type === 'magazine') return <BookOpen size={16} className="mr-1" />;
    if (type === 'notes') return <FileText size={16} className="mr-1" />;
    if (type === 'ebook') return <Download size={16} className="mr-1" />;
    return <Tag size={16} className="mr-1" />;
  };

  const getProductTypeName = (type: string) => {
    return t.filterParams.filters[type as keyof typeof t.filterParams.filters] || type;
  };

  const scrollToCollection = () => {
    document.getElementById("collection-grid")?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div className="min-h-screen bg-white pb-20 dark:bg-neutral-950">
        
        {/* HERO BÖLÜMÜ - ETKİNLİK SAYFASI TARZI YAPI */}
        <section className="relative overflow-hidden border-b border-neutral-200 dark:border-neutral-800">
          <div className="relative z-10 mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              
              {/* Sol Taraf - Metinler */}
              <div className="text-left order-2 lg:order-1">
                <div className="mb-7 flex items-center gap-3 text-sm font-medium text-[#990000] dark:text-[#e08b94]">
                  <span className="h-px w-8 bg-current" aria-hidden="true" />
                  <span>{t.hero.badge}</span>
                </div>

                <h1 className="mb-6 text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-neutral-950 sm:text-5xl lg:text-[3.55rem] dark:text-white">
                  {t.hero.title}
                </h1>

                <p className="mb-8 max-w-xl text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8 dark:text-neutral-300">
                  {t.hero.subtitle}
                </p>

                <div className="mb-8 flex flex-wrap gap-x-8 gap-y-4 border-t border-neutral-200 pt-5 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
                  {t.hero.stats.map((stat) => (
                    <div key={stat.label} className="flex flex-col items-start">
                      <span className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
                        {stat.value}
                      </span>
                      <span>{stat.label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={scrollToCollection}
                    className="group flex min-h-12 items-center justify-center rounded-md bg-[#990000] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#780000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#990000] focus-visible:ring-offset-4"
                  >
                    {t.hero.exploreTarget}
                    <ArrowDownIcon className="ml-2 w-4 h-4 group-hover:translate-y-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Sağ Taraf - Öne Çıkanlar (Carousel) */}
              <div className="order-1 lg:order-2 h-full">
                {featuredProducts.length > 0 ? (
                  <div className="relative h-[450px] w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 sm:h-[500px] lg:h-[570px] dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="p-6 lg:p-8 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-4 lg:mb-6">
                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                          {t.hero.featuredTitle}
                        </h3>
                        {featuredProducts.length > 1 && (
                          <div className="flex space-x-2">
                            {featuredProducts.map((_, index) => (
                              <div
                                key={index}
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  index === currentSlide
                                    ? 'bg-primary w-6'
                                    : 'bg-neutral-300 dark:bg-neutral-600 w-2'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="relative flex-1 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950">
                        <div 
                          className="flex transition-transform duration-700 ease-out h-full"
                          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                        >
                          {featuredProducts.map((product) => (
                            <Link 
                              key={product.id}
                              href={`/${locale}/collection/${product.slug}`}
                              className="w-full flex-shrink-0 h-full flex flex-col group block cursor-pointer"
                            >
                              <div className="relative h-[65%] w-full overflow-hidden bg-gray-100 dark:bg-neutral-900">
                                {product.thumbnail_url ? (
                                  <Image
                                    src={product.thumbnail_url}
                                    alt={product.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center text-gray-300 dark:text-neutral-600">
                                    <BookOpen size={64} />
                                  </div>
                                )}
                                
                                <div className="absolute top-4 left-4">
                                  <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center shadow-lg">
                                    {getProductIcon(product.product_type)}
                                    {getProductTypeName(product.product_type)}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="p-5 flex-1 flex flex-col justify-between">
                                <div>
                                  <h4 className="font-bold text-lg text-neutral-900 dark:text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                                    {product.title}
                                  </h4>
                                  <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                                    {product.short_description || product.description || "Harika bir dijital ürün."}
                                  </p>
                                </div>
                                <div className="flex items-center justify-between mt-4">
                                  <div className="flex items-center gap-2">
                                    {product.original_price && product.original_price > product.price && !product.is_free && (
                                      <span className="text-gray-400 dark:text-gray-500 line-through text-sm font-medium">
                                        ₺{product.original_price}
                                      </span>
                                    )}
                                    <span className="font-bold text-lg text-neutral-900 dark:text-white">
                                      {product.is_free ? t.filterParams.free : `₺${product.price}`}
                                    </span>
                                  </div>
                                  <div className="text-primary font-medium text-sm flex items-center group-hover:underline">
                                    {t.hero.buyNow}
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-[450px] lg:h-[550px] w-full bg-gray-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center border border-dashed border-gray-300 dark:border-neutral-700">
                    <div className="text-center opacity-50">
                      <BookOpen size={48} className="mx-auto mb-4" />
                      <p>Koleksiyon ürünleri yakında...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* KOLEKSİYON LİSTESİ */}
        <div id="collection-grid" className="mx-auto max-w-7xl px-5 pt-14 sm:px-6 sm:pt-16 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Sol Filtreleme Alanı */}
            <div className="w-full lg:w-1/4">
              <div className="top-24 rounded-xl border border-neutral-200 bg-neutral-50 p-5 lg:sticky dark:border-neutral-800 dark:bg-neutral-900">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Filter size={18} className="mr-2 text-primary" /> Filtreler
                </h3>
                
                {/* Arama Kutusu */}
                <div className="relative mb-6">
                  <input 
                    type="text" 
                    placeholder={t.filterParams.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white"
                  />
                  <Search size={16} className="absolute left-3 top-3.5 text-gray-400" />
                </div>

                {/* Kategoriler */}
                <div className="space-y-2">
                  {Object.entries(t.filterParams.filters).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setActiveFilter(key)}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-between ${
                        activeFilter === key 
                          ? 'bg-primary text-white shadow-md' 
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <span>{label}</span>
                      {activeFilter === key && <ArrowRight size={14} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sağ Ürün Listesi */}
            <div className="w-full lg:w-3/4">
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold dark:text-white text-gray-900">
                    {activeFilter === 'all' ? t.filterParams.title : t.filterParams.filters[activeFilter as keyof typeof t.filterParams.filters]}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">{filteredProducts.length} adet ürün bulundu</p>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <Link 
                      key={product.id} 
                      href={`/${locale}/collection/${product.slug}`}
                      className="group block flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-colors duration-300 hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-600"
                    >
                      {/* Görsel */}
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100 dark:bg-neutral-900">
                        {product.thumbnail_url ? (
                          <Image 
                            src={product.thumbnail_url} 
                            alt={product.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-300 dark:text-neutral-600">
                            <BookOpen size={48} />
                          </div>
                        )}
                        
                        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                          {getProductIcon(product.product_type)}
                          {getProductTypeName(product.product_type)}
                        </div>
                      </div>

                      {/* İçerik */}
                      <div className="p-5 flex flex-col flex-grow text-left">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                          {product.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 flex-grow">
                          {product.short_description || product.description || "Açıklama bulunmuyor..."}
                        </p>
                        
                        {/* Fiyat ve Buton */}
                        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-neutral-700 flex items-center justify-between">
                          <div className="flex flex-col">
                            {product.original_price && product.original_price > product.price && !product.is_free && (
                                <span className="text-gray-400 line-through text-xs font-medium mb-0.5">₺{product.original_price}</span>
                            )}
                            <div className="font-bold text-lg text-neutral-900 dark:text-white">
                              {product.is_free ? t.filterParams.free : `₺${product.price}`}
                            </div>
                          </div>
                          {(purchasedIds.has(product.id) || product.is_free) ? (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                router.push(`/${locale}/collection/${product.slug}/view`);
                              }}
                              className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center"
                            >
                              {locale === 'tr' ? 'Ürünü İncele' : 'View'}
                            </button>
                          ) : (
                            <div 
                              className="bg-neutral-900 dark:bg-white text-white dark:text-black group-hover:bg-primary dark:group-hover:bg-primary px-4 py-2 group-hover:text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center"
                            >
                              <ShoppingBag className="w-4 h-4 mr-2" />
                              {t.filterParams.buyNow}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-neutral-800 rounded-2xl p-16 text-center border border-gray-100 dark:border-neutral-700 shadow-sm">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <Search size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t.filterParams.noProducts}</h3>
                  <p className="text-gray-500 dark:text-gray-400">Filtreleri değiştirerek tekrar aramayı deneyebilirsiniz.</p>
                  <button 
                    onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
                    className="mt-6 font-semibold bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-900 dark:text-white px-6 py-2.5 rounded-lg transition-colors"
                  >
                    Filtreleri Temizle
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArrowDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <polyline points="19 12 12 19 5 12"></polyline>
    </svg>
  );
}
