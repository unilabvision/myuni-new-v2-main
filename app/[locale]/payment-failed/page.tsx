'use client';

import React, { Suspense, use } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

interface PaymentFailedPageProps {
  params: Promise<{ locale: string }>;
}

const texts = {
  tr: {
    title: 'Ödeme Tamamlanamadı',
    subtitle: 'İşlem sırasında bir sorun oluştu. Ücret alınmadıysa tekrar deneyebilirsiniz.',
    retry: 'Tekrar Dene',
    home: 'Ana Sayfaya Dön',
    contact: 'Destek ile iletişime geç',
    loading: 'Yükleniyor...',
    errors: {
      missing_token: 'Ödeme oturumu bulunamadı.',
      payment_failed: 'Ödeme banka/Iyzico tarafından reddedildi veya iptal edildi.',
      order_not_found: 'Sipariş kaydı bulunamadı.',
      application_update_failed: 'Ödeme alındı ancak başvuru güncellenemedi. Destek ile iletişime geçin.',
      shopier_disabled: 'Shopier ödemeleri kapatıldı. Lütfen site üzerinden Iyzico ile ödeme yapın.',
      internal_error: 'Beklenmeyen bir hata oluştu.',
    } as Record<string, string>,
  },
  en: {
    title: 'Payment Could Not Be Completed',
    subtitle: 'Something went wrong during checkout. If you were not charged, you can try again.',
    retry: 'Try Again',
    home: 'Back to Home',
    contact: 'Contact support',
    loading: 'Loading...',
    errors: {
      missing_token: 'Payment session was not found.',
      payment_failed: 'Payment was declined or cancelled by the bank/Iyzico.',
      order_not_found: 'Order record was not found.',
      application_update_failed: 'Payment may have succeeded but the application could not be updated. Please contact support.',
      shopier_disabled: 'Shopier payments are disabled. Please pay via Iyzico on the site.',
      internal_error: 'An unexpected error occurred.',
    } as Record<string, string>,
  },
};

function PaymentFailedContent({ locale }: { locale: string }) {
  const searchParams = useSearchParams();
  const t = texts[locale as keyof typeof texts] || texts.tr;
  const errorCode = searchParams.get('error') || 'internal_error';
  const detail = t.errors[errorCode] || t.errors.internal_error;
  const contactHref = `/${locale}/${locale === 'en' ? 'contact' : 'iletisim'}`;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
          <AlertCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{t.title}</h1>
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">{t.subtitle}</p>
        <p className="mt-4 rounded-lg bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {detail}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#990000] px-5 py-3 text-sm font-semibold text-white hover:bg-[#770000]"
          >
            <RefreshCw className="h-4 w-4" />
            {t.retry}
          </button>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 dark:border-neutral-600 px-5 py-3 text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.home}
          </Link>
        </div>
        <p className="mt-6 text-xs text-neutral-500">
          <Link href={contactHref} className="text-[#990000] hover:underline">
            {t.contact}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function PaymentFailedPage({ params }: PaymentFailedPageProps) {
  const { locale } = use(params);
  const t = texts[locale as keyof typeof texts] || texts.tr;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-neutral-500">
          {t.loading}
        </div>
      }
    >
      <PaymentFailedContent locale={locale} />
    </Suspense>
  );
}
