// app/[locale]/payment-success/page.tsx
"use client";

import React, { useEffect, useState, Suspense, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Play, BookOpen, ShoppingBag, Folder } from 'lucide-react';
import supabase from '../../_services/supabaseClient';
import { useCart } from '../../context/CartContext';

interface PaymentSuccessPageProps {
  params: Promise<{
    locale: string;
  }>;
}

const texts = {
  tr: {
    congratulations: "Tebrikler! Satın Alma İşlemi Başarılı!",
    courseAdded: "kursunuz hesabınıza tanımlanmıştır.",
    productAdded: "Ürününüz hesabınıza tanımlanmıştır.",
    cartAdded: "Sepetinizdeki ürünler başarıyla hesabınıza tanımlanmıştır.",
    orderSummary: "Sipariş Özeti",
    freeDiscount: "%100 İndirim Uygulandı",
    startNow: "Kursunuza hemen başlayabilir veya dilediğiniz zaman hesabınızdan erişebilirsiniz.",
    productStartNow: "Ürününüze hemen erişebilir veya dilediğiniz zaman koleksiyonunuzdan ulaşabilirsiniz.",
    cartStartNow: "Satın aldığınız eğitimlere Kontrol Panelinizden, dijital ürünlerinize ise Koleksiyonunuzdan hemen erişebilirsiniz.",
    support: "Sorularınız için destek ekibimizle iletişime geçebilirsiniz.",
    goToCourse: "Kursa Git",
    goToProduct: "Ürünü İncele",
    goToDashboard: "Kontrol Paneline Git",
    myCourses: "Kurslarım",
    myCollection: "Koleksiyonum",
    needHelp: "Desteğe ihtiyacınız varsa",
    contactUs: "bizimle iletişime geçin",
    loading: "Yükleniyor...",
    thankYou: "Teşekkürler!",
    enjoyLearning: "Başarılı çalışmalar dileriz!",
    courseAccess: "📚 Kursa Nasıl Erişirim?",
    courseAccessDesc: "Hesabınızdan \"Kurslarım\" bölümüne giderek tüm kurslarınızı görüntüleyebilir ve istediğiniz zaman eğitimlere devam edebilirsiniz.",
    productAccess: "📦 Ürüne Nasıl Erişirim?",
    productAccessDesc: "Hesabınızdan \"Koleksiyonum\" bölümüne giderek satın aldığınız tüm dijital ürünlere ulaşabilirsiniz.",
    certificate: "🏆 Sertifika Kazanma",
    certificateDesc: "Kursu %100 tamamladığınızda dijital sertifikanızı otomatik olarak kazanacak ve indirebileceksiniz.",
    eventApplicationPaid: "Sertifika paketi ödemeniz alındı. Başvurunuz onay sürecine alındı.",
    backToEvent: "Etkinliğe Dön",
    errorFetchingCourse: "İçerik bilgileri alınırken hata oluştu",
    course: "Kurs",
    product: "Ürün",
    purchasedItems: "Satın Alınan Ürünler",
  },
  en: {
    congratulations: "Congratulations! Purchase Successful",
    courseAdded: "course has been added to your account.",
    productAdded: "product has been added to your account.",
    cartAdded: "Items in your cart have been successfully defined to your account.",
    orderSummary: "Order Summary",
    freeDiscount: "100% Discount Applied",
    startNow: "You can start your course immediately or access it from your account anytime.",
    productStartNow: "You can access your product immediately or find it in your collection anytime.",
    cartStartNow: "You can access your purchased courses from your Dashboard, and digital products from your Collection.",
    support: "You can contact our support team for any questions.",
    goToCourse: "Go to Course",
    goToProduct: "View Product",
    goToDashboard: "Go to Dashboard",
    myCourses: "My Courses",
    myCollection: "My Collection",
    needHelp: "If you need support",
    contactUs: "contact us",
    loading: "Loading...",
    thankYou: "Thank you!",
    enjoyLearning: "We wish you success!",
    courseAccess: "📚 How to Access Course?",
    courseAccessDesc: "You can view all your courses and continue learning anytime by going to \"My Courses\" section in your account.",
    productAccess: "📦 How to Access Product?",
    productAccessDesc: "You can access all your purchased digital products by going to \"My Collection\" section in your account.",
    certificate: "🏆 Earning Certificate",
    certificateDesc: "When you complete 100% of the course, you will automatically earn and be able to download your digital certificate.",
    eventApplicationPaid: "Your certificate package payment was received. Your application is now in review.",
    backToEvent: "Back to Event",
    errorFetchingCourse: "Error fetching content information",
    course: "Course",
    product: "Product",
    purchasedItems: "Purchased Items",
  }
};

function decodeUrlString(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

function PaymentSuccessContent({ params }: PaymentSuccessPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { clearCart } = useCart();

  // Ödeme başarılı olduğu için sepeti temizle
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  const orderIdParam = searchParams.get('order_id');
  const courseId = searchParams.get('courseId');
  const rawName = searchParams.get('name');
  const itemName = rawName ? decodeUrlString(rawName) : null;
  const isFreePurchase = searchParams.get('free') === 'true';
  const orderId = searchParams.get('orderId');
  const paymentId = searchParams.get('paymentId');
  const itemType = searchParams.get('type') || 'course';
  const isProduct = itemType === 'product';
  const isEventApplication = itemType === 'event_application';
  const eventSlugParam = searchParams.get('eventSlug') || '';
  const applicationIdParam = searchParams.get('applicationId') || '';
  
  // Cart Mode fields
  const isCartMode = searchParams.get('cartMode') === 'true';
  const rawNames = searchParams.get('names');
  const cartItemNames = rawNames ? decodeUrlString(rawNames).split(', ') : [];

  // Callback kaçtıysa Iyzico'dan durumu çek (pending → completed / payment_review / failed)
  // Event certificate siparişleri de dahil — guest ödemelerde callback düşerse
  // sadece bu sayfa + cron reconcile kurtarabilir.
  useEffect(() => {
    if (!orderId || isFreePurchase) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/iyzico-reconcile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });
        const data = await res.json().catch(() => null);
        if (!cancelled && data?.orderStatus && data.orderStatus !== 'completed') {
          console.info('Iyzico reconcile:', data);
        }
      } catch (e) {
        console.error('Iyzico reconcile call failed:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, isFreePurchase]);

  const [itemSlug, setItemSlug] = useState<string | null>(null);
  const [itemTitle, setItemTitle] = useState<string | null>(null);
  const [loadingItem, setLoadingItem] = useState(true);
  const [resolvingOrder, setResolvingOrder] = useState(!!orderIdParam && !courseId && !isCartMode);

  const resolvedParams = use(params);
  const { locale } = resolvedParams;
  const t = texts[locale as keyof typeof texts] || texts.tr;

  // Legacy: order_id ile geldiyse çöz (tekil kurs ödemeleri)
  useEffect(() => {
    if (isCartMode || !orderIdParam || courseId) {
      if ((orderIdParam && courseId) || isCartMode) setResolvingOrder(false);
      return;
    }
    setResolvingOrder(true);
    const resolveOrderAndRedirect = async () => {
      try {
        const res = await fetch(`/api/order-by-id?order_id=${encodeURIComponent(orderIdParam)}`);
        const data = await res.json();
        if (data.success && data.courseId) {
          const p = new URLSearchParams(window.location.search);
          p.set('courseId', data.courseId);
          if (data.courseName) p.set('name', encodeURIComponent(data.courseName));
          p.set('orderId', orderIdParam);
          p.delete('order_id');
          window.history.replaceState({}, '', `${window.location.pathname}?${p.toString()}`);
          window.location.reload();
        } else {
          setResolvingOrder(false);
        }
      } catch (e) {
        console.error('Order resolve error:', e);
        setResolvingOrder(false);
        setLoadingItem(false);
      }
    };
    resolveOrderAndRedirect();
  }, [orderIdParam, courseId, isCartMode]);

  // Kurs veya Ürün bilgilerini çek (Sepet modunda değilsek)
  useEffect(() => {
    const fetchItemData = async () => {
      if (isCartMode || !courseId) {
        setLoadingItem(false);
        return;
      }
      try {
        if (isProduct) {
          const { data, error } = await supabase
            .from('myuni_products')
            .select('slug, title')
            .eq('id', courseId)
            .single();

          if (error || !data) {
            console.error('Error fetching product data:', error);
            setLoadingItem(false);
            return;
          }
          setItemSlug(data.slug);
          setItemTitle(data.title);
        } else {
          const { data, error } = await supabase
            .from('myuni_courses')
            .select('slug, title')
            .eq('id', courseId)
            .single();

          if (error || !data) {
            console.error('Error fetching course data:', error);
            setLoadingItem(false);
            return;
          }
          setItemSlug(data.slug);
          setItemTitle(data.title);
        }
      } catch (err) {
        console.error('Error in fetchItemData:', err);
      } finally {
        setLoadingItem(false);
      }
    };
    fetchItemData();
  }, [courseId, isProduct, isCartMode]);

  useEffect(() => {
    if (isEventApplication) return;
    if (isLoaded && !user) {
      router.push(`/${locale}/login`);
    }
    if (!isCartMode && !courseId && !orderIdParam) {
      router.push(`/${locale}/${locale === 'tr' ? 'kurs' : 'course'}`);
    }
  }, [isLoaded, user, courseId, orderIdParam, isCartMode, isEventApplication, router, locale]);

  if (isEventApplication) {
    const eventSegment = locale === 'en' ? 'event' : 'etkinlik';
    const eventHref = eventSlugParam
      ? `/${locale}/${eventSegment}/${eventSlugParam}`
      : `/${locale}/${eventSegment}`;

    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900 py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm p-8">
            <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h1 className="text-2xl font-medium text-neutral-800 dark:text-neutral-200 mb-2">
              {t.congratulations}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8">
              {t.eventApplicationPaid}
            </p>
            {orderId && (
              <p className="text-sm text-neutral-500 mb-6">
                Sipariş No: <span className="font-mono">{orderId}</span>
              </p>
            )}
            <Link
              href={eventHref}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#990000] hover:bg-[#770000] text-white rounded-lg text-sm font-medium"
            >
              {t.backToEvent}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded || (loadingItem && !isCartMode) || resolvingOrder || (!isCartMode && !courseId && !orderIdParam)) {
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

  // Sepet modu değilse ve slug bulunamazsa hata
  if (!isCartMode && !itemSlug) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900 flex items-center justify-center">
        <div className="p-8 max-w-md w-full mx-auto text-center">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl">!</span>
          </div>
          <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            {t.errorFetchingCourse}
          </h2>
          <div className="flex gap-4 justify-center mt-6">
            <Link
              href={`/${locale}/dashboard`}
              className="px-6 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg text-sm"
            >
              {isProduct ? t.myCollection : t.myCourses}
            </Link>
            <Link
              href={`/${locale}/${isProduct ? 'collection' : (locale === 'tr' ? 'kurs' : 'course')}`}
              className="px-6 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg text-sm border border-neutral-300 dark:border-neutral-600"
            >
              {isProduct ? 'Koleksiyon' : 'Kurslar'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayName = itemTitle || itemName || (isProduct ? 'MyUNI Ürünü' : 'MyUNI Eğitimi');

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 py-20">
      <div className="max-w-3xl mx-auto px-6 lg:px-6">
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm p-8">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={40} className="text-green-500" />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-medium text-neutral-800 dark:text-neutral-200 mb-2">
            {t.congratulations}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8">
            {isCartMode ? (
              t.cartAdded
            ) : isProduct ? (
              t.productAdded
            ) : (
              <><span className="font-medium">{displayName}</span>{' '}{t.courseAdded}</>
            )}
          </p>

          {/* Order Summary */}
          <div className="bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg p-6 mb-8">
            <h3 className="font-medium text-neutral-700 dark:text-neutral-300 mb-4">{t.orderSummary}</h3>
            <div className="space-y-3">
              {isCartMode ? (
                <div>
                  <span className="text-neutral-600 dark:text-neutral-400 block mb-2">{t.purchasedItems}:</span>
                  <ul className="list-disc pl-5 space-y-1">
                    {cartItemNames.map((name, i) => (
                      <li key={i} className="text-neutral-800 dark:text-neutral-200 font-medium text-sm">
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {isProduct ? t.product : t.course}:
                  </span>
                  <span className="text-neutral-800 dark:text-neutral-200 font-medium">{displayName}</span>
                </div>
              )}
              {orderId && (
                <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-600 mt-2">
                  <span className="text-neutral-600 dark:text-neutral-400">Sipariş No:</span>
                  <span className="text-neutral-800 dark:text-neutral-200 font-mono text-sm">{orderId}</span>
                </div>
              )}
              {paymentId && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Ödeme ID:</span>
                  <span className="text-neutral-800 dark:text-neutral-200 font-mono text-sm">{paymentId}</span>
                </div>
              )}
              {isFreePurchase && (
                <div className="mt-4">
                  <span className="inline-block text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full">
                    {t.freeDiscount}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              {isCartMode ? (
                <Folder className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              ) : isProduct ? (
                <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              ) : (
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="text-left">
                <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed mb-2">
                  {isCartMode ? t.cartStartNow : (isProduct ? t.productStartNow : t.startNow)}
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-sm">{t.support}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {isCartMode ? (
              <Link
                href={`/${locale}/dashboard`}
                className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-8 py-3 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center font-medium justify-center"
              >
                <Folder size={16} className="mr-2" />
                {t.goToDashboard}
                <ArrowRight size={16} className="ml-2" />
              </Link>
            ) : isProduct ? (
              <Link
                href={`/${locale}/collection/${itemSlug}/view`}
                className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-8 py-3 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center font-medium justify-center"
              >
                <ShoppingBag size={16} className="mr-2" />
                {t.goToProduct}
                <ArrowRight size={16} className="ml-2" />
              </Link>
            ) : (
              <Link
                href={`/${locale}/watch/course/${itemSlug}`}
                className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-8 py-3 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center font-medium justify-center"
              >
                <Play size={16} className="mr-2" fill="currentColor" />
                {t.goToCourse}
                <ArrowRight size={16} className="ml-2" />
              </Link>
            )}
          </div>

          {/* Thank You */}
          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
            <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-200 mb-2">{t.thankYou}</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">{t.enjoyLearning}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t.needHelp},{' '}
              <Link
                href={`/${locale}/iletisim`}
                className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors underline"
              >
                {t.contactUs}
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
            <h4 className="font-medium text-neutral-800 dark:text-neutral-200 mb-3">
              {isCartMode ? "📚 İçeriklere Erişim" : (isProduct ? t.productAccess : t.courseAccess)}
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {isCartMode ? (locale === 'en' ? "You can easily access and review all your purchased training courses from the 'My Courses' section in your Dashboard, and your digital products from the 'My Collection' area anytime." : "Satın aldığınız tüm eğitimlere Kontrol Panelinizde yer alan “Kurslarım” bölümünden, dijital ürünlerinize ise “Koleksiyonum” alanından dilediğiniz zaman kolayca erişebilir ve inceleyebilirsiniz.") : (isProduct ? t.productAccessDesc : t.courseAccessDesc)}
            </p>
          </div>

          {(!isProduct || isCartMode) && (
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
              <h4 className="font-medium text-neutral-800 dark:text-neutral-200 mb-3">{t.certificate}</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{t.certificateDesc}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage({ params }: PaymentSuccessPageProps) {
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
      <PaymentSuccessContent params={params} />
    </Suspense>
  );
}