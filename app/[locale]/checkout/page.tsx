// app/[locale]/checkout/page.tsx
"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense, use, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ExternalLink, X, Shield, ShoppingBag } from 'lucide-react';
import supabase from '../../_services/supabaseClient.js';
import { useCart, getActivePrice as getCartItemActivePrice } from '../../context/CartContext';

interface CheckoutPageProps {
  params: Promise<{
    locale: string;
  }>;
}

// Define proper types for better type safety
interface CourseData {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price?: number;
  thumbnail_url?: string;
  slug: string;
  is_active: boolean;
  early_bird_price?: number | null;
  early_bird_deadline?: string | null;
  /** Shopier link ile satış: varsa ödeme bu linkte, OAuth2 kullanılmaz */
  shopier_product_url?: string | null;
  /** Tier checkout: tam eğitim paketi mi? */
  isFullCourse?: boolean;
}

interface DiscountCode {
  code: string;
  discountAmount: number;
  type: 'percentage' | 'fixed' | 'balance';
  validUntil: string;
  applicableCourses: string[];
  max_usage: number;
  usage_count: number;
  is_referral: boolean;
  has_balance_limit?: boolean;
  remaining_balance?: number | null;
  owner_id?: string | null;
  /** Sipariş tutarı bundan düşükse kod uygulanmaz */
  minimum_order_amount?: number | null;
  /** Yalnızca tam eğitim (full course) tier'larında geçerli */
  full_course_only?: boolean;
}

interface AppliedDiscount {
  code: string;
  value: number;
  type: 'percentage' | 'fixed' | 'balance';
  amount: number;
  remainingAfter?: number | null;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  zipCode: string;
  notes: string;
}

interface FormErrors {
  [key: string]: string;
}

// Error type for API responses
interface ApiError {
  message?: string;
}

// Dil metinleri
const texts = {
  tr: {
    pageTitle: "Sipariş Özeti",
    backToCourse: "Kursa Dön",
    personalInfo: "Kişisel Bilgiler",
    fullName: "Ad Soyad",
    email: "E-posta",
    phone: "Telefon",
    address: "Adres",
    city: "Şehir",
    district: "İlçe",
    zipCode: "Posta Kodu",
    orderNotes: "Sipariş Notu (İsteğe Bağlı)",
    discountCode: "İndirim Kodu",
    applyDiscount: "Uygula",
    appliedDiscounts: "Uygulanan İndirim Kodları",
    referralCode: "Referans Kodu",
    applyReferral: "Uygula",
    appliedReferral: "Uygulanan Referans",
    referralSuccess: "Referans kodu başarıyla uygulandı!",
    invalidReferral: "Geçersiz referans kodu",
    referralExpired: "Bu referans kodunun süresi dolmuş",
    referralAlreadyApplied: "Referans kodu zaten uygulandı",
    referralSelfUse: "Kendi referans kodunu kullanamazsın",
    enterReferralCode: "Lütfen bir referans kodu girin",
    referralNote: "Arkadaşından aldığın referans kodunu buraya yazabilirsin",
    referralCodeApplied: "Referral kodu otomatik olarak uygulandı!",
    orderSummary: "Sipariş Özeti",
    productAmount: "Ürün Tutarı",
    subtotal: "Ara Toplam (KDV Hariç)",
    vatIncluded: "%20 KDV dahildir",
    discount: "İndirim",
    vat: "KDV (%20)",
    total: "Toplam",
    proceedToPayment: "Ödemeye Geç",
    processing: "İşleniyor...",
    securePayment: "Güvenli Ödeme",
    paymentInfo: "Ödeme işleminiz güvenli iyzico altyapısı üzerinden gerçekleştirilecektir.",
    privacyNoteBefore: "Ödemeye geçerek ",
    privacyPolicyLink: "Gizlilik Politikamızı",
    privacyNoteAnd: " ve ",
    termsLink: "Kullanım Koşullarımızı",
    privacyNoteAfter: " kabul etmiş olursunuz.",
    privacyUrl: "/tr/gizlilik",
    termsUrl: "/tr/sartlar-ve-kosullar",
    required: "zorunludur",
    currency: "₺",
    loading: "Yükleniyor...",
    error: "Hata oluştu",
    earlyBirdPrice: "Erken Kayıt Fiyatı",
    earlyBirdEndsIn: "Erken kayıt fırsatı bitiyor:",
    days: "gün",
    hours: "saat",
    minutes: "dakika",
    seconds: "saniye",
    missingParams: "Gerekli parametreler eksik",
    invalidDiscount: "Geçersiz indirim kodu",
    discountExpired: "Bu indirim kodunun süresi dolmuş",
    discountNotApplicable: "Bu indirim kodu bu kurs için geçerli değil",
    discountMinOrder: "Bu indirim kodu için minimum sipariş tutarı karşılanmıyor",
    discountFullCourseOnly: "Bu indirim kodu yalnızca tam eğitim paketi için geçerlidir",
    discountAlreadyApplied: "Bu indirim kodu zaten uygulandı",
    discountOnlyOne: "Sadece bir indirim kodu kullanabilirsin",
    referralOnlyOne: "Sadece bir referans kodu kullanabilirsin",
    enterDiscountCode: "Lütfen bir indirim kodu girin",
    digitalProduct: "Dijital ürünse 'Dijital Ürün' yazabilirsiniz.",
  },
  en: {
    pageTitle: "Order Summary",
    backToCourse: "Back to Course",
    personalInfo: "Personal Information",
    fullName: "Full Name",
    email: "Email",
    phone: "Phone",
    address: "Address",
    city: "City",
    district: "District",
    zipCode: "Zip Code",
    orderNotes: "Order Notes (Optional)",
    discountCode: "Discount Code",
    applyDiscount: "Apply",
    appliedDiscounts: "Applied Discount Codes",
    referralCode: "Referral Code",
    applyReferral: "Apply",
    appliedReferral: "Applied Referral",
    referralSuccess: "Referral code successfully applied!",
    invalidReferral: "Invalid referral code",
    referralExpired: "This referral code has expired",
    referralAlreadyApplied: "Referral code already applied",
    referralSelfUse: "You cannot use your own referral code",
    enterReferralCode: "Please enter a referral code",
    referralNote: "You can enter the referral code you received from your friend here",
    referralCodeApplied: "Referral code automatically applied!",
    orderSummary: "Order Summary",
    productAmount: "Product Amount",
    subtotal: "Subtotal (VAT Excluded)",
    vatIncluded: "20% VAT included",
    discount: "Discount",
    vat: "VAT (20%)",
    total: "Total",
    proceedToPayment: "Proceed to Payment",
    processing: "Processing...",
    securePayment: "Secure Payment",
    paymentInfo: "Your payment will be processed through secure iyzico infrastructure.",
    privacyNoteBefore: "By proceeding to payment, you accept our ",
    privacyPolicyLink: "Privacy Policy",
    privacyNoteAnd: " and ",
    termsLink: "Terms of Use",
    privacyNoteAfter: ".",
    privacyUrl: "/en/privacy",
    termsUrl: "/en/terms",
    required: "is required",
    currency: "$",
    loading: "Loading...",
    error: "Error occurred",
    earlyBirdPrice: "Early Bird Price",
    earlyBirdEndsIn: "Early bird offer ends in:",
    days: "days",
    hours: "hours",
    minutes: "minutes",
    seconds: "seconds",
    missingParams: "Required parameters missing",
    invalidDiscount: "Invalid discount code",
    discountExpired: "This discount code has expired",
    discountNotApplicable: "This discount code is not applicable for this course",
    discountMinOrder: "This discount code requires a higher minimum order amount",
    discountFullCourseOnly: "This discount code is only valid for the full education package",
    discountAlreadyApplied: "This discount code is already applied",
    discountOnlyOne: "You can only use one discount code",
    referralOnlyOne: "You can only use one referral code",
    enterDiscountCode: "Please enter a discount code",
    digitalProduct: "For digital products, you can write 'Digital Product'.",
  }
};

// Rich text'i plain text'e dönüştürme fonksiyonu
const stripRichText = (richText: string): string => {
  if (!richText) return '';
  
  // HTML taglerini kaldır
  const withoutTags = richText.replace(/<[^>]*>/g, '');
  
  // HTML entity'lerini decode et
  const decoded = withoutTags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Çoklu boşlukları tek boşluk yap
  const cleaned = decoded.replace(/\s+/g, ' ').trim();
  
  // İlk 150 karakteri al
  return cleaned.length > 150 ? cleaned.substring(0, 150) + '...' : cleaned;
};

function CheckoutContent({ params }: CheckoutPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  
  const resolvedParams = use(params);
  const { locale } = resolvedParams;
  const t = texts[locale as keyof typeof texts] || texts.tr;

  // Cart mode support
  const { items: cartItems, clearCart } = useCart();
  const isCartMode = searchParams.get('mode') === 'cart';
  const cartIdsParam = searchParams.get('cartIds') || '';

  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [productData, setProductData] = useState<{ id: string; title: string; price: number; thumbnail_url?: string | null; slug: string; description: string } | null>(null);
  const [itemType, setItemType] = useState<'course' | 'product' | 'package' | 'tier'>('course');
  const [tierId, setTierId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  
  // Discount states
  const [discountCode, setDiscountCode] = useState('');
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const [appliedDiscounts, setAppliedDiscounts] = useState<AppliedDiscount[]>([]);
  
  // Referral states
  const [referralCode, setReferralCode] = useState('');
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState('');
  const [appliedReferral, setAppliedReferral] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const affiliateAutoAppliedRef = React.useRef(false);
  
  // Form states
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    zipCode: '',
    notes: ''
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  // Early bird countdown state
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Early bird helper functions
  const isEarlyBirdActive = (course: CourseData) => {
    if (!course.early_bird_price || !course.early_bird_deadline) return false;
    const deadline = new Date(course.early_bird_deadline);
    const now = new Date();
    return now < deadline;
  };

  const getActivePrice = (course: CourseData) => {
    if (isEarlyBirdActive(course) && course.early_bird_price) {
      return course.early_bird_price;
    }
    return course.price;
  };

  const getTimeRemaining = (course: CourseData) => {
    if (!course.early_bird_deadline) return null;
    
    const now = new Date();
    const deadline = new Date(course.early_bird_deadline);
    const diff = deadline.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds, total: diff };
  };

  const fetchCourseData = useCallback(async (courseId: string) => {
    try {
      setPageLoading(true);
      
      const { data, error: supabaseError } = await supabase
        .from('myuni_courses')
        .select('*')
        .eq('id', courseId)
        .eq('is_active', true)
        .single();

      if (supabaseError || !data) {
        console.error('Course fetch error:', supabaseError);
        const coursePath = locale === 'tr' ? 'kurs' : 'course';
        router.push(`/${locale}/${coursePath}`);
        return;
      }

      setCourseData(data as CourseData);

      // Tier'lı kurslarda doğrudan full-course checkout'u engelle
      const { count } = await supabase
        .from('myuni_course_tiers')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', courseId)
        .eq('is_active', true);

      if (count && count > 0) {
        const coursePath = locale === 'tr' ? 'kurs' : 'course';
        router.push(`/${locale}/${coursePath}/${data.slug}`);
        return;
      }

      // Iyzico checkout — Shopier yönlendirmesi yok
    } catch (fetchError) {
      console.error('Error fetching course:', fetchError);
      setError(t.error);
    } finally {
      setPageLoading(false);
    }
  }, [locale, router, t.error]);

  const fetchTierData = useCallback(async (courseId: string, selectedTierId: string) => {
    try {
      setPageLoading(true);

      const { data: tier, error: tierError } = await supabase
        .from('myuni_course_tiers')
        .select('*')
        .eq('id', selectedTierId)
        .eq('course_id', courseId)
        .eq('is_active', true)
        .single();

      if (tierError || !tier) {
        console.error('Tier fetch error:', tierError);
        const coursePath = locale === 'tr' ? 'kurs' : 'course';
        router.push(`/${locale}/${coursePath}`);
        return;
      }

      const { data: course, error: courseError } = await supabase
        .from('myuni_courses')
        .select('id, title, thumbnail_url, slug, is_active')
        .eq('id', courseId)
        .eq('is_active', true)
        .single();

      if (courseError || !course) {
        console.error('Parent course fetch error:', courseError);
        const coursePath = locale === 'tr' ? 'kurs' : 'course';
        router.push(`/${locale}/${coursePath}`);
        return;
      }

      setTierId(selectedTierId);
      setCourseData({
        id: course.id,
        title: `${course.title} — ${tier.title}`,
        description: tier.description || '',
        price: Number(tier.price) || 0,
        original_price: tier.original_price != null ? Number(tier.original_price) : undefined,
        early_bird_price: tier.early_bird_price,
        early_bird_deadline: tier.early_bird_deadline,
        thumbnail_url: course.thumbnail_url,
        slug: course.slug,
        is_active: true,
        shopier_product_url: tier.shopier_product_url,
        isFullCourse: tier.is_full_course === true || tier.slug === 'tam-egitim',
      } as CourseData);
    } catch (fetchError) {
      console.error('Error fetching tier:', fetchError);
      setError(t.error);
    } finally {
      setPageLoading(false);
    }
  }, [locale, router, t.error]);

  const fetchProductData = useCallback(async (productId: string) => {
    try {
      setPageLoading(true);
      const { data, error: supabaseError } = await supabase
        .from('myuni_products')
        .select('id, title, price, original_price, thumbnail_url, slug, description, short_description')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (supabaseError || !data) {
        console.error('Product fetch error:', supabaseError);
        router.push(`/${locale}/collection`);
        return;
      }
      // Map product to courseData shape so existing UI reuses without changes
      setCourseData({
        id: data.id,
        title: data.title,
        description: data.description || data.short_description || '',
        price: data.price,
        original_price: data.original_price,
        thumbnail_url: data.thumbnail_url,
        slug: data.slug,
        is_active: true,
      } as CourseData);
      setProductData(data);
    } catch (fetchError) {
      console.error('Error fetching product:', fetchError);
      setError(t.error);
    } finally {
      setPageLoading(false);
    }
  }, [locale, router, t.error]);

  const fetchPackageData = useCallback(async (packageId: string) => {
    try {
      setPageLoading(true);
      const { data, error: supabaseError } = await supabase
        .from('myuni_packages')
        .select('id, title, price, original_price, thumbnail_url, slug, description')
        .eq('id', packageId)
        .eq('is_active', true)
        .single();

      if (supabaseError || !data) {
        console.error('Package fetch error:', supabaseError);
        router.push(`/${locale}`);
        return;
      }
      // Map package to courseData shape so existing UI reuses without changes
      setCourseData({
        id: data.id,
        title: data.title,
        description: data.description || '',
        price: data.price,
        original_price: data.original_price,
        thumbnail_url: data.thumbnail_url,
        slug: data.slug,
        is_active: true,
      } as CourseData);
    } catch (fetchError) {
      console.error('Error fetching package:', fetchError);
      setError(t.error);
    } finally {
      setPageLoading(false);
    }
  }, [locale, router, t.error]);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push(`/${locale}/login`);
      return;
    }

    const courseId = searchParams.get('id');
    const isCartMode = searchParams.get('mode') === 'cart' || searchParams.get('cartMode') === 'true';

    // URL parametreleri henüz yüklenmediyse (Next.js hydration gecikmesi) yönlendirmeyi beklet
    const hasId = searchParams.has('id');
    const hasCart = searchParams.has('mode') || searchParams.has('cartIds');
    if (!hasId && !hasCart) {
      return;
    }

    // Eğer sepet modunda değilsek ve courseId yoksa, kurslar sayfasına yönlendir
    if (!isCartMode && !courseId) {
      const coursePath = locale === 'tr' ? 'kurs' : 'course';
      router.push(`/${locale}/${coursePath}`);
      return;
    }

    // URL'den veya localStorage'dan referans kodunu al ve otomatik uygula
    const urlReferralCode = searchParams.get('ref');
    const storedReferralCode = typeof window !== 'undefined' ? localStorage.getItem('myuni_referral_code') : null;
    const referralCodeToUse = urlReferralCode || storedReferralCode;
    
    if (referralCodeToUse) {
      console.log('Referral code found:', referralCodeToUse, 'Source:', urlReferralCode ? 'URL' : 'localStorage');
      setReferralCode(referralCodeToUse);
      
      const applyReferralCode = async () => {
        try {
          setReferralLoading(true);
          setReferralError('');

          const response = await fetch('/api/referral-usage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: referralCodeToUse.trim() }),
          });

          const data = await response.json();

          if (data.success) {
            setAppliedReferral(referralCodeToUse.trim());
            setReferralCode('');
            setReferralError('');
            showToast(t.referralCodeApplied || 'Referans kodu otomatik olarak uygulandı!', 'success');
            
            if (typeof window !== 'undefined') {
              localStorage.removeItem('myuni_referral_code');
            }
          } else {
            console.log('Referral code validation failed:', data.error);
            setReferralError(data.error || 'Geçersiz referral kodu');
          }
        } catch (error) {
          console.error('Referral validation error:', error);
          setReferralError('Referral kodu doğrulanırken hata oluştu');
        } finally {
          setReferralLoading(false);
        }
      };
      
      applyReferralCode();
    }

    // Kullanıcı bilgilerini form'a doldur
    if (isLoaded && user) {
      setFormData(prev => ({
        ...prev,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.primaryEmailAddress?.emailAddress || '',
        phone: user.phoneNumbers?.[0]?.phoneNumber || ''
      }));
    }

    if (isCartMode) {
      // Sepet modunda tekil ürün doğrulamalarını atla
      setPageLoading(false);
    } else if (courseId) {
      const type = searchParams.get('type');
      const urlTierId = searchParams.get('tierId');
      if (type === 'product') {
        setItemType('product');
        fetchProductData(courseId);
      } else if (type === 'package') {
        setItemType('package');
        fetchPackageData(courseId);
      } else if (type === 'tier' && urlTierId) {
        setItemType('tier');
        fetchTierData(courseId, urlTierId);
      } else {
        setItemType('course');
        fetchCourseData(courseId);
      }
    }
    
  }, [searchParams, isLoaded, user, router, locale, fetchCourseData, fetchProductData, fetchPackageData, fetchTierData]);

  // Early bird countdown timer
  useEffect(() => {
    if (courseData && isEarlyBirdActive(courseData)) {
      const timeRemaining = getTimeRemaining(courseData);
      if (timeRemaining) {
        setCountdown(timeRemaining);
        
        const timer = setInterval(() => {
          const newTimeRemaining = getTimeRemaining(courseData);
          if (newTimeRemaining) {
            setCountdown(newTimeRemaining);
          } else {
            setCountdown(null);
            clearInterval(timer);
          }
        }, 1000);

        return () => clearInterval(timer);
      }
    } else {
      setCountdown(null);
    }
  }, [courseData]);

  const calculateTotalDiscount = () => {
    // Sadece indirim kodlarından gelen indirimi hesapla, referans kodları indirim yapmaz
    return appliedDiscounts.reduce((total, discount) => total + discount.value, 0);
  };

  const validateDiscountCodeWithValue = async (codeValue: string) => {
    console.log('validateDiscountCodeWithValue called with code:', codeValue);
    
    if (!codeValue.trim()) {
      console.log('Empty code value, showing error');
      setDiscountError(t.enterDiscountCode);
      return;
    }
    
    if (appliedDiscounts.some(item => item.code.toLowerCase() === codeValue.toLowerCase())) {
      console.log('Code already applied, showing error');
      setDiscountError(t.discountAlreadyApplied);
      return;
    }

    // Zaten bir indirim kodu uygulanmışsa yeni indirim kodu eklenemez
    if (appliedDiscounts.length > 0) {
      console.log('Already have a discount code applied, showing error');
      setDiscountError(t.discountOnlyOne);
      return;
    }
    
    console.log('Starting discount code validation...');
    setDiscountLoading(true);
    setDiscountError('');

    let foundCode: DiscountCode;
    let fullCourseOnly: boolean;
    let minimumOrderAmount: number;

    try {
      const validateRes = await fetch(`/api/discount-codes/validate?locale=${locale}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeValue.trim(),
          courseId: !isCartMode && courseData ? courseData.id : null,
          itemType: isCartMode ? 'cart' : itemType,
          isFullCourse: isCartMode
            ? cartItems.some(
                (ci) =>
                  cartIdsParam.split(',').includes(ci.id) &&
                  ci.type === 'tier' &&
                  ci.isFullCourse
              )
            : !!courseData?.isFullCourse,
          coursePrice: !isCartMode && courseData ? getActivePrice(courseData) : undefined,
          locale,
        }),
      });

      const validateJson = await validateRes.json();
      if (!validateJson.success || !validateJson.data) {
        setDiscountError(validateJson.error || t.invalidDiscount);
        setDiscountLoading(false);
        return;
      }

      const d = validateJson.data;
      foundCode = {
        code: d.code,
        discountAmount: Number(d.discountAmount),
        type: d.type,
        validUntil: d.validUntil,
        applicableCourses: d.applicableCourses || [],
        max_usage: Number(d.max_usage) || 0,
        usage_count: Number(d.usage_count) || 0,
        is_referral: false,
        has_balance_limit: !!d.has_balance_limit,
        remaining_balance: d.remaining_balance ?? null,
        owner_id: d.owner_id || null,
        minimum_order_amount: d.minimum_order_amount ?? null,
        full_course_only: !!d.full_course_only,
      };
      fullCourseOnly = Boolean(d.fullCourseOnly);
      minimumOrderAmount = Number(d.minimumOrderAmount) || 0;
      console.log('Validated discount code via API:', foundCode);
    } catch (err) {
      console.error('Discount validate API error:', err);
      setDiscountError(t.invalidDiscount);
      setDiscountLoading(false);
      return;
    }

    if (fullCourseOnly && isCartMode) {
      const activeCartItemsForFull = cartItems.filter((ci) =>
        cartIdsParam.split(',').includes(ci.id)
      );
      const hasFullCourseItem = activeCartItemsForFull.some(
        (ci) => ci.type === 'tier' && ci.isFullCourse
      );
      if (!hasFullCourseItem) {
        setDiscountError(t.discountFullCourseOnly);
        setDiscountLoading(false);
        return;
      }
    }
    
    let discountValue = 0;
    const activeCartItems = isCartMode ? cartItems.filter(ci => cartIdsParam.split(',').includes(ci.id)) : [];
    const cartTotal = isCartMode ? activeCartItems.reduce((sum, ci) => sum + getCartItemActivePrice(ci), 0) : 0;
    
    if (isCartMode) {
      // ---- CART MODE DISCOUNT CALCULATION ----
      let eligibleItems = foundCode.applicableCourses.length > 0
        ? activeCartItems.filter(ci => {
            const productId = ci.type === 'tier' ? (ci.courseId ?? ci.id) : ci.id;
            return foundCode.applicableCourses.includes(productId);
          })
        : activeCartItems;

      if (fullCourseOnly) {
        eligibleItems = eligibleItems.filter(ci => ci.type === 'tier' && ci.isFullCourse);
      }

      if (foundCode.applicableCourses.length > 0 && eligibleItems.length === 0) {
        console.log('Code not applicable for any items in the cart, showing error');
        setDiscountError(t.discountNotApplicable);
        setDiscountLoading(false);
        return;
      }

      if (fullCourseOnly && eligibleItems.length === 0) {
        setDiscountError(t.discountFullCourseOnly);
        setDiscountLoading(false);
        return;
      }

      const eligibleTotal = eligibleItems.reduce((sum, ci) => sum + getCartItemActivePrice(ci), 0);

      if (minimumOrderAmount > 0 && eligibleTotal < minimumOrderAmount) {
        setDiscountError(
          locale === 'tr'
            ? `${t.discountMinOrder} (min. ${minimumOrderAmount.toLocaleString('tr-TR')} ₺)`
            : `${t.discountMinOrder} (min. ${minimumOrderAmount.toLocaleString('en-US')} ₺)`
        );
        setDiscountLoading(false);
        return;
      }

      if (foundCode.has_balance_limit && foundCode.remaining_balance !== null && foundCode.remaining_balance !== undefined) {
        const remainingBalance = foundCode.remaining_balance;
        if (remainingBalance >= eligibleTotal) {
          discountValue = eligibleTotal;
        } else {
          discountValue = remainingBalance;
        }
        console.log(`Cart balance limit active: ${discountValue} TL applied`);
      } else {
        if (foundCode.type === 'percentage') {
          discountValue = (eligibleTotal * foundCode.discountAmount) / 100;
          console.log(`Cart percentage discount: Applied ${foundCode.discountAmount}% to ${eligibleTotal} TL = ${discountValue} TL`);
        } else {
          discountValue = foundCode.discountAmount;
          if (discountValue > eligibleTotal) {
            discountValue = eligibleTotal;
          }
          console.log(`Cart fixed discount: Applied ${discountValue} TL`);
        }
      }
    } else {
      // ---- SINGLE ITEM DISCOUNT CALCULATION ----
      const singlePrice = courseData ? getActivePrice(courseData) : 0;
      if (minimumOrderAmount > 0 && singlePrice < minimumOrderAmount) {
        setDiscountError(
          locale === 'tr'
            ? `${t.discountMinOrder} (min. ${minimumOrderAmount.toLocaleString('tr-TR')} ₺)`
            : `${t.discountMinOrder} (min. ${minimumOrderAmount.toLocaleString('en-US')} ₺)`
        );
        setDiscountLoading(false);
        return;
      }

      // Eğer bakiye limiti aktifse, discount_amount'u görmezden gel ve bakiye mantığına göre hesapla
      if (foundCode.has_balance_limit && foundCode.remaining_balance !== null && foundCode.remaining_balance !== undefined && courseData) {
        const coursePrice = singlePrice;
        const remainingBalance = foundCode.remaining_balance;
        
        // Bakiye yeterliyse %100 indirim (kurs bedava)
        if (remainingBalance >= coursePrice) {
          discountValue = coursePrice;
          console.log(`Balance limit active: Full discount (100%) applied: ${discountValue} TL`);
        } else {
          // Bakiye yetersizse, sadece kalan bakiye kadar indirim yap
          discountValue = remainingBalance;
          console.log(`Balance limit active: Partial discount applied (remaining balance): ${discountValue} TL`);
        }
      } else if (courseData) {
        // Normal indirim hesaplama (bakiye limiti yoksa)
        if (foundCode.type === 'percentage') {
          discountValue = (singlePrice * foundCode.discountAmount) / 100;
          console.log(`Applying ${foundCode.discountAmount}% discount: ${discountValue}`);
        } else {
          discountValue = foundCode.discountAmount;
          if (discountValue > singlePrice) {
            discountValue = singlePrice;
          }
          console.log(`Applying fixed discount: ${discountValue}`);
        }
      }
    }
    
    // İndirim kodunu veritabanında kullanıldı olarak işaretle
    try {
      const response = await fetch(`/api/discount-usage?locale=${locale}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: foundCode.code, 
          userId: user?.id || user?.emailAddresses?.[0]?.emailAddress,
          discountAmount: discountValue,
          // Minimum tutar kontrolü için indirime konu olan tutar
          coursePrice: isCartMode
            ? (foundCode.applicableCourses.length > 0 || fullCourseOnly
                ? activeCartItems
                    .filter(ci => {
                      const productId = ci.type === 'tier' ? (ci.courseId ?? ci.id) : ci.id;
                      const courseOk = foundCode.applicableCourses.length === 0 || foundCode.applicableCourses.includes(productId);
                      const fullOk = !fullCourseOnly || (ci.type === 'tier' && ci.isFullCourse);
                      return courseOk && fullOk;
                    })
                    .reduce((sum, ci) => sum + getCartItemActivePrice(ci), 0)
                : cartTotal)
            : (courseData ? getActivePrice(courseData) : 0),
          isFullCourse: isCartMode
            ? cartItems.some(ci => cartIdsParam.split(',').includes(ci.id) && ci.type === 'tier' && ci.isFullCourse)
            : !!courseData?.isFullCourse,
          itemType: isCartMode ? 'cart' : itemType,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        console.warn('Discount code usage info:', data.error);
        // Spesifik hata mesajlarını göster
        if (data.error === 'Bu kodun kullanım limiti dolmuş') {
          setDiscountError(locale === 'tr' ? 'Bu indirim kodunu daha önce başarıyla tamamlanan bir alışverişte kullandınız. Her kod yalnızca bir kez kullanılabilir.' : 'You have already used this discount code in a completed purchase. Each code can only be used once.');
        } else if (data.error === 'Geçersiz indirim kodu') {
          setDiscountError(t.invalidDiscount);
        } else {
          setDiscountError(data.error || (locale === 'tr' ? 'İndirim kodu uygulanamadı' : 'Discount code could not be applied'));
        }
        setDiscountLoading(false);
        return;
      }

      console.log('Discount code marked as used in database');
    } catch (error) {
      console.error('Error marking discount code as used:', error);
      setDiscountError('İndirim kodu uygulanamadı');
      setDiscountLoading(false);
      return;
    }

    console.log('Adding discount to applied discounts');
    const remainingAfter =
      foundCode.has_balance_limit && foundCode.remaining_balance !== null && foundCode.remaining_balance !== undefined
        ? Math.max(0, Number(foundCode.remaining_balance) - discountValue)
        : null;

    setAppliedDiscounts(prev => [
      ...prev, 
      { 
        code: foundCode.code, 
        value: discountValue,
        type: foundCode.type,
        amount: foundCode.discountAmount,
        remainingAfter
      }
    ]);
    
    setDiscountCode('');
    
    // Clear the affiliate code from localStorage after successfully applying it
    if (typeof window !== 'undefined') {
      console.log('Removing affiliate code from localStorage after applying');
      localStorage.removeItem('myuni_affiliate_code');
    }
    
    console.log('Discount code successfully applied');
    setDiscountLoading(false);
  };

  // Affiliate kod: sayfa hazır olunca tek seferde validate API ile uygula
  useEffect(() => {
    if (pageLoading || appliedDiscounts.length > 0 || affiliateAutoAppliedRef.current) return;
    if (typeof window === 'undefined') return;
    const affiliateCode = localStorage.getItem('myuni_affiliate_code');
    if (!affiliateCode) return;
    if (!isCartMode && !courseData) return;
    affiliateAutoAppliedRef.current = true;
    setDiscountCode(affiliateCode);
    void validateDiscountCodeWithValue(affiliateCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot affiliate apply when page ready
  }, [pageLoading, courseData, isCartMode]);

  const validateDiscountCode = async () => {
    await validateDiscountCodeWithValue(discountCode);
  };
  
  const removeDiscountCode = (codeToRemove: string) => {
    setAppliedDiscounts(appliedDiscounts.filter(item => item.code !== codeToRemove));
  };

  const validateReferralCode = async () => {
    if (!referralCode.trim()) {
      setReferralError(t.enterReferralCode);
      return;
    }

    if (appliedReferral) {
      setReferralError(t.referralAlreadyApplied);
      return;
    }

    // Zaten bir referral kodu uygulanmışsa yeni referral kodu uygulanamaz
    // (İndirim kodu ile birlikte kullanılabilir)

    setReferralLoading(true);
    setReferralError('');

    try {
      const response = await fetch('/api/referral-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: referralCode.trim() }),
      });

      const data = await response.json();

            if (data.success) {
              setAppliedReferral(referralCode.trim());
              setReferralCode('');
              setReferralError('');
              // Başarı mesajı gösterme
            } else {
              // Spesifik hata mesajlarını göster
              if (data.error === 'Kendi referral kodunu kullanamazsın') {
                setReferralError(t.referralSelfUse);
              } else if (data.error === 'Bu kodun kullanım limiti dolmuş') {
                setReferralError('Bu kodun kullanım limiti dolmuş');
              } else if (data.error === 'Geçersiz referral kodu') {
                setReferralError(t.invalidReferral);
              } else {
                setReferralError(data.error || t.invalidReferral);
              }
            }
    } catch (error) {
      console.error('Referral validation error:', error);
      setReferralError(t.invalidReferral);
    } finally {
      setReferralLoading(false);
    }
  };

  const removeReferralCode = () => {
    setAppliedReferral(null);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateForm = () => {
    const errors: FormErrors = {};
    
    const requiredFields = ['fullName', 'email', 'phone', 'address', 'city'];
    requiredFields.forEach(field => {
      if (!formData[field as keyof FormData]?.trim()) {
        errors[field] = `${field} ${t.required}`;
      }
    });
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Geçerli bir e-posta adresi girin';
    }
    
    if (formData.phone && !/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/\s+/g, ''))) {
      errors.phone = 'Geçerli bir telefon numarası girin';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const proceedToPayment = async () => {
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }

    // Cart mode: use cart items; single mode: require courseData
    if (!isCartMode && !courseData) {
      router.push(`/${locale}/login`);
      return;
    }
    
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const totalDiscount = calculateTotalDiscount();

      let paymentData: Record<string, unknown>;

      if (isCartMode) {
        // ---- CART MODE: multiple items ----
        const activeCartItems = cartItems.filter(ci => cartIdsParam.split(',').includes(ci.id));
        const cartTotal = activeCartItems.reduce((sum, ci) => sum + getCartItemActivePrice(ci), 0);
        const finalPrice = Math.max(0, cartTotal - totalDiscount);

        paymentData = {
          // Cart mode marker
          cartMode: true,
          cartItems: activeCartItems.map(ci => ({
            id: ci.id,
            title: ci.title,
            price: getCartItemActivePrice(ci),
            originalPrice: ci.price,
            type: ci.type,
            slug: ci.slug,
            courseId: ci.courseId,
            tierId: ci.tierId,
          })),
          // Legacy single-item fields for backward compat (primary item)
          courseId: 'CART',
          courseName: `Sepet (${activeCartItems.length} ürün)`,
          amount: finalPrice,
          email: formData.email,
          phone: formData.phone,
          name: formData.fullName,
          address: formData.address,
          city: formData.city,
          district: formData.district,
          zipCode: formData.zipCode,
          discountCodes: appliedDiscounts.map(d => d.code).join(','),
          totalDiscount: totalDiscount,
          referralCode: appliedReferral,
          notes: formData.notes,
          locale: locale,
          clerkUserId: user.id,
          userId: user.id,
          itemType: 'cart',
        };
      } else {
        // ---- SINGLE ITEM MODE (original flow) ----
        const activePrice = getActivePrice(courseData!);
        const finalPrice = activePrice - totalDiscount;

        paymentData = {
          courseId: courseData!.id,
          tierId: itemType === 'tier' ? tierId : undefined,
          courseName: courseData!.title,
          amount: finalPrice > 0 ? finalPrice : 0,
          email: formData.email,
          phone: formData.phone,
          name: formData.fullName,
          address: formData.address,
          city: formData.city,
          district: formData.district,
          zipCode: formData.zipCode,
          discountCodes: appliedDiscounts.map(d => d.code).join(','),
          totalDiscount: totalDiscount,
          referralCode: appliedReferral,
          notes: formData.notes,
          locale: locale,
          clerkUserId: user.id,
          userId: user.id,
          itemType: itemType,
        };
      }
      
      const response = await fetch('/api/iyzico-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Ödeme başlatılamadı');
      }
      
      // %100 indirim için direkt yönlendirme
      if (data.redirectToDirect && data.redirectUrl) {
        if (isCartMode) clearCart();
        window.location.href = data.redirectUrl;
        return;
      }
      
      // Iyzico ödeme sayfasına yönlendir
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      
      // Legacy: form-based fallback
      if (data.formAction && data.formData) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.formAction;
        form.style.display = 'none';
        Object.entries(data.formData).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value as string;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        return;
      }
      
      throw new Error('Geçersiz API yanıtı');
      
    } catch (apiError: unknown) {
      console.error('Payment redirect error:', apiError);
      const error = apiError as ApiError;
      setError(error.message || 'Ödeme sayfasına yönlendirme sırasında bir hata oluştu.');
      setLoading(false);
    }
  };

  
  if (!isLoaded || pageLoading || (!isCartMode && !courseData)) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900 flex items-center justify-center">
        <div className="p-8 max-w-md w-full mx-auto">
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-2 border-neutral-200 dark:border-neutral-700 border-t-neutral-800 dark:border-t-neutral-300 rounded-full animate-spin"></div>
            <p className="mt-4 text-neutral-500 dark:text-neutral-400 text-sm font-light">{t.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  // Tekil checkout'ta courseData garanti; sepet modunda null olabilir
  const singleCourse = !isCartMode ? courseData : null;
  const singleItemPrice = singleCourse ? getActivePrice(singleCourse) : 0;
  
  const totalDiscount = calculateTotalDiscount();
  
  // Course URL'ini locale'e göre düzenle
  const getCoursePath = () => {
    if (isCartMode) return `/${locale}/cart`;
    if (!courseData) return `/${locale}`;
    
    if (itemType === 'package') {
      const packagePath = locale === 'tr' ? 'paket' : 'package';
      return `/${locale}/${packagePath}/${courseData.slug}`;
    }
    
    if (itemType === 'product') {
      return `/${locale}/collection`;
    }
    
    if (locale === 'tr') {
      return `/${locale}/kurs/${courseData.slug}`;
    } else {
      return `/${locale}/course/${courseData.slug}`;
    }
  };

  // Cart mode: compute active cart items from cartIdsParam
  const activeCartItems = isCartMode
    ? cartItems.filter(ci => cartIdsParam.split(',').includes(ci.id))
    : [];
  const cartTotal = isCartMode
    ? activeCartItems.reduce((sum, ci) => sum + getCartItemActivePrice(ci), 0)
    : 0;
  const finalCartTotal = Math.max(0, cartTotal - totalDiscount);
  
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 py-12">
      <div className="max-w-7xl mx-auto px-4 lg:px-4">
        {/* Header */}
        <div className="mb-8 flex items-center">
          <Link 
            href={getCoursePath()} 
            className="text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors mr-4"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-medium text-neutral-800 dark:text-neutral-200">{t.pageTitle}</h1>
        </div>
        
        {/* Course/Cart Preview */}
        {isCartMode ? (
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg mb-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center gap-3">
              <ShoppingBag size={18} className="text-neutral-500 dark:text-neutral-400" />
              <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                {locale === 'tr' ? 'Sepetinizdeki Ürünler' : 'Items in Your Cart'} ({activeCartItems.length})
              </h2>
            </div>
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {activeCartItems.map(ci => {
                const ap = getCartItemActivePrice(ci);
                const isEb = ci.earlyBirdPrice && ap !== ci.price;
                return (
                  <li key={ci.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-700">
                      {ci.thumbnailUrl ? (
                        <Image src={ci.thumbnailUrl} alt={ci.title} fill className="object-cover" sizes="48px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={16} className="text-neutral-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 line-clamp-1">{ci.title}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {ci.type === 'course' 
                          ? (locale === 'tr' ? 'Eğitim' : 'Course') 
                          : ci.type === 'package'
                            ? (locale === 'tr' ? 'Eğitim Paketi' : 'Training Package')
                            : (locale === 'tr' ? 'Ürün' : 'Product')}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-sm font-semibold ${isEb ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-800 dark:text-neutral-200'}`}>
                        {ap.toFixed(2)}₺
                      </span>
                      {isEb && (
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 line-through">{ci.price.toFixed(2)}₺</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : courseData ? (
          <div className="bg-neutral-50 dark:bg-neutral-800 p-6 rounded-lg mb-8">
            <div className="flex items-start gap-6">
              <div className="relative w-24 h-24 flex-shrink-0">
                <Image 
                  src={courseData.thumbnail_url || '/images/default-course.jpg'} 
                  alt={courseData.title}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-medium text-neutral-800 dark:text-neutral-200 mb-2">
                  {courseData.title}
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-4">
                  {stripRichText(courseData.description)}
                </p>
                
                <div className="mt-4">
                  {isEarlyBirdActive(courseData) ? (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl sm:text-2xl font-medium text-amber-600 dark:text-amber-500">
                            {t.currency}{getActivePrice(courseData)?.toFixed(2) || "0.00"}
                          </span>
                          <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                            (KDV Dahil)
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                          <span className="text-xs sm:text-sm text-amber-600 dark:text-amber-500 font-medium">
                            {t.earlyBirdPrice}
                          </span>
                        </div>
                      </div>
                      {courseData.original_price && (
                        <div className="flex items-center gap-2">
                          <span className="text-base sm:text-lg text-neutral-400 line-through">
                            {t.currency}{courseData.original_price.toFixed(2)}
                          </span>
                          <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                            (Normal Fiyat)
                          </span>
                        </div>
                      )}
                      {countdown && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                          <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 font-medium mb-2">
                            {t.earlyBirdEndsIn}
                          </p>
                          <div className="grid grid-cols-4 gap-2 sm:flex sm:items-center sm:gap-4 text-xs sm:text-sm">
                            <div className="text-center">
                              <div className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-500">{countdown.days}</div>
                              <div className="text-xs text-amber-600 dark:text-amber-500">{t.days}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-500">{countdown.hours}</div>
                              <div className="text-xs text-amber-600 dark:text-amber-500">{t.hours}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-500">{countdown.minutes}</div>
                              <div className="text-xs text-amber-600 dark:text-amber-500">{t.minutes}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-500">{countdown.seconds}</div>
                              <div className="text-xs text-amber-600 dark:text-amber-500">{t.seconds}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <span className="text-2xl font-medium text-neutral-800 dark:text-neutral-200">
                        {t.currency}{courseData.price?.toFixed(2) || "0.00"}
                      </span>
                      <span className="ml-2 text-sm text-neutral-500 dark:text-neutral-400">
                        (KDV Dahil)
                      </span>
                      {courseData.original_price && (
                        <span className="ml-3 text-lg text-neutral-400 line-through">
                          {t.currency}{courseData.original_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
        
        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg mb-6">
            <p>{error}</p>
          </div>
        )}
        
        {/* Form Errors */}
        {Object.keys(formErrors).length > 0 && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg mb-6">
            <p className="font-medium mb-2">Lütfen aşağıdaki hataları düzeltin:</p>
            <ul className="list-disc pl-5">
              {Object.entries(formErrors).map(([field, errorMsg]) => (
                <li key={field}>{errorMsg}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
              <div className="bg-neutral-50 dark:bg-neutral-800 p-4">
                <h3 className="font-medium text-neutral-800 dark:text-neutral-200">{t.personalInfo}</h3>
              </div>
              
              <div className="p-4 sm:p-6 space-y-4">
                {/* Ad Soyad */}
                <div>
                  <label htmlFor="fullName" className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                    {t.fullName} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full p-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-200 ${
                      formErrors.fullName ? 'border-red-300' : 'border-neutral-200 dark:border-neutral-700'
                    }`}
                  />
                  {formErrors.fullName && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.fullName}</p>
                  )}
                </div>
                
                {/* E-posta */}
                <div>
                  <label htmlFor="email" className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                    {t.email} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full p-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500 text-neutral-900  dark:bg-neutral-800 dark:text-neutral-200 ${
                      formErrors.email ? 'border-red-300' : 'border-neutral-200 dark:border-neutral-700'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>
                  )}
                </div>
                
                {/* Telefon */}
                <div>
                  <label htmlFor="phone" className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                    {t.phone} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+90 555 555 55 55"
                    className={`w-full p-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500 text-neutral-900  dark:bg-neutral-800 dark:text-neutral-200 ${
                      formErrors.phone ? 'border-red-300' : 'border-neutral-200 dark:border-neutral-700'
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.phone}</p>
                  )}
                </div>
                
                {/* Adres */}
                <div>
                  <label htmlFor="address" className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                    {t.address} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder={t.digitalProduct}
                    rows={2}
                    className={`w-full p-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500 text-neutral-900  dark:bg-neutral-800 dark:text-neutral-200 ${
                      formErrors.address ? 'border-red-300' : 'border-neutral-200 dark:border-neutral-700'
                    }`}
                  />
                  {formErrors.address && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.address}</p>
                  )}
                </div>
                
                {/* Şehir ve İlçe */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                      {t.city} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full p-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500 text-neutral-900  dark:bg-neutral-800 dark:text-neutral-200 ${
                        formErrors.city ? 'border-red-300' : 'border-neutral-200 dark:border-neutral-700'
                      }`}
                    />
                    {formErrors.city && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.city}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="district" className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                      {t.district}
                    </label>
                    <input
                      type="text"
                      id="district"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      className="w-full p-3 text-sm border border-neutral-200 text-neutral-900  dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500 dark:bg-neutral-800 dark:text-neutral-200"
                    />
                  </div>
                </div>
                
                {/* Posta Kodu */}
                <div>
                  <label htmlFor="zipCode" className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                    {t.zipCode}
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="w-full p-3 text-sm border border-neutral-200 dark:border-neutral-700 text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500 dark:bg-neutral-800 dark:text-neutral-200"
                  />
                </div>
              </div>
            </div>
            
            {/* Sipariş Notu */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 sm:p-6">
              <label htmlFor="notes" className="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                {t.orderNotes}
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Siparişinizle ilgili eklemek istediğiniz notlar..."
                className="w-full p-3 text-sm border border-neutral-200 dark:border-neutral-700 text-neutral-900  rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500 dark:bg-neutral-800 dark:text-neutral-200"
              />
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-4 lg:space-y-6">
            {/* İndirim Kodu */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">{t.discountCode}</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="İndirim kodu girin"
                  className="flex-1 p-2 text-sm border border-neutral-200 text-black dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:bg-neutral-800 dark:text-neutral-200"
                />
                <button
                  onClick={validateDiscountCode}
                  disabled={discountLoading}
                  className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors text-sm whitespace-nowrap disabled:opacity-50 sm:min-w-[80px]"
                >
                  {discountLoading ? (
                    <div className="w-3 h-3 border-2 border-white dark:border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    t.applyDiscount
                  )}
                </button>
              </div>
              {discountError && (
                <p className="mt-1 text-xs text-red-500">{discountError}</p>
              )}
              
              {/* Uygulanan İndirim Kodları */}
              {appliedDiscounts.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t.appliedDiscounts}:</p>
                  {appliedDiscounts.map((discount, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <div>
                        <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">{discount.code}</span>
                        <span className="text-xs text-neutral-600 dark:text-neutral-400 ml-2">
                          {discount.type === 'balance'
                            ? (discount.remainingAfter !== null && discount.remainingAfter !== undefined
                                ? `Kalan: ${discount.remainingAfter.toFixed(2)}${t.currency}`
                                : 'Çek / Bakiye')
                            : discount.type === 'percentage'
                              ? `%${discount.amount}`
                              : `${discount.amount.toFixed(2)}${t.currency}`}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-green-600 dark:text-green-400 mr-2">
                          -{discount.value.toFixed(2)}{t.currency}
                        </span>
                        <button 
                          onClick={() => removeDiscountCode(discount.code)}
                          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Referans Kodu */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">{t.referralCode}</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">{t.referralNote}</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  placeholder="Referans kodu girin"
                  className="flex-1 p-2 text-sm border border-neutral-200 text-black dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-500 dark:bg-neutral-800 dark:text-neutral-200"
                />
                <button
                  onClick={validateReferralCode}
                  disabled={referralLoading}
                  className="px-4 py-2 bg-[#990000] text-white rounded-lg hover:bg-[#770000] transition-colors text-sm whitespace-nowrap disabled:opacity-50 sm:min-w-[80px]"
                >
                  {referralLoading ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    t.applyReferral
                  )}
                </button>
              </div>
              {referralError && (
                <p className="mt-1 text-xs text-red-500">{referralError}</p>
              )}
              
              {/* Uygulanan Referans Kodu */}
              {appliedReferral && (
                <div className="mt-3">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">{t.appliedReferral}:</p>
                  <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div>
                      <span className="text-xs font-medium text-green-800 dark:text-green-200">{appliedReferral}</span>
                      <span className="text-xs text-green-600 dark:text-green-400 ml-2">
                        ✓ Kaydedildi
                      </span>
                    </div>
                    <button 
                      onClick={removeReferralCode}
                      className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Sipariş Özeti */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">{t.orderSummary}</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">{t.productAmount}</span>
                  <span className="text-neutral-800 dark:text-neutral-200">
                    {isCartMode ? (
                      `${cartTotal.toFixed(2)}${t.currency}`
                    ) : singleCourse ? (
                      isEarlyBirdActive(singleCourse) && singleCourse.original_price 
                        ? `${singleCourse.original_price.toFixed(2)}${t.currency}`
                        : `${(getActivePrice(singleCourse)?.toFixed(2) || "0.00")}${t.currency}`
                    ) : (
                      `0.00${t.currency}`
                    )}
                  </span>
                </div>
                {!isCartMode && singleCourse && isEarlyBirdActive(singleCourse) && singleCourse.original_price && (
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-600 dark:text-amber-500">{t.earlyBirdPrice}</span>
                    <span className="text-amber-600 dark:text-amber-500">
                      -{((singleCourse.original_price || 0) - (getActivePrice(singleCourse) || 0)).toFixed(2)}{t.currency}
                    </span>
                  </div>
                )}
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">{t.discount}</span>
                    <span className="text-green-600 dark:text-green-400">-{totalDiscount.toFixed(2)}{t.currency}</span>
                  </div>
                )}
                <div className="border-t border-neutral-200 dark:border-neutral-700 pt-2 mt-2 flex justify-between font-medium">
                  <span className="text-neutral-800 dark:text-neutral-200">{t.total}</span>
                  <span className="text-neutral-800 dark:text-neutral-200">
                    {isCartMode ? (
                      `${finalCartTotal.toFixed(2)}${t.currency}`
                    ) : (
                      `${(singleItemPrice - totalDiscount).toFixed(2)}${t.currency}`
                    )}
                  </span>
                </div>
                <div className="flex justify-end text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  <span>{t.vatIncluded}</span>
                </div>
              </div>
            </div>
            
            {/* Ödeme Bilgisi */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-blue-600 dark:text-blue-400 text-xs">
                {t.paymentInfo}
              </p>
            </div>
            
            {/* Ödeme Butonu */}
            <button
              onClick={proceedToPayment}
              disabled={loading}
              className="w-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 py-3 px-4 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white dark:border-neutral-900 border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span className="text-sm">{t.processing}</span>
                </span>
              ) : (
                <span className="flex items-center text-sm">
                  {isCartMode ? (
                    `${finalCartTotal.toFixed(2)}${t.currency}`
                  ) : (
                    `${(singleItemPrice - totalDiscount).toFixed(2)}${t.currency}`
                  )} {t.proceedToPayment}
                  <ExternalLink size={14} className="ml-2" />
                </span>
              )}
            </button>
            
            {/* Gizlilik Bildirimi */}
            <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center mt-4">
              {t.privacyNoteBefore}
              <Link
                href={t.privacyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-neutral-300 dark:hover:text-neutral-300"
              >
                {t.privacyPolicyLink}
              </Link>
              {t.privacyNoteAnd}
              <Link
                href={t.termsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-neutral-300 dark:hover:text-neutral-300"
              >
                {t.termsLink}
              </Link>
              {t.privacyNoteAfter}
            </p>
            
            {/* Güvenli Ödeme Logoları */}
            <div className="mt-6 text-center">
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-3">{t.securePayment}</p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-400" />
                <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <span>Visa</span>
                  <span>•</span>
                  <span>Mastercard</span>
                  <span>•</span>
                  <span>Troy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          toast.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center">
            <span className="text-sm font-medium flex-1 pr-2">{toast.message}</span>
            <button 
              onClick={() => setToast(null)}
              className="flex-shrink-0 text-white hover:text-gray-200"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-neutral-900 flex items-center justify-center">
        <div className="p-8 max-w-md w-full mx-auto">
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-2 border-neutral-200 dark:border-neutral-700 border-t-neutral-800 dark:border-t-neutral-300 rounded-full animate-spin"></div>
            <p className="mt-4 text-neutral-500 dark:text-neutral-400 text-sm font-light">Yükleniyor...</p>
          </div>
        </div>
      </div>
    }>
      <CheckoutContent params={params} />
    </Suspense>
  );
}