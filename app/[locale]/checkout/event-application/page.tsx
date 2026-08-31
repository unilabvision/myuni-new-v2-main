'use client';

import React, { Suspense, use, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Shield } from 'lucide-react';
import LegalConsentFields, {
  validateLegalConsentClient,
  type LegalConsentValues,
  type LegalConsentErrors,
} from '@/app/components/forms/LegalConsentFields';

interface CheckoutPageProps {
  params: Promise<{ locale: string }>;
}

interface ApplicationCheckout {
  id: string;
  email: string;
  name: string;
  eventTitle: string;
  eventSlug: string;
  eventId: string | null;
  amount: number;
}

const texts = {
  tr: {
    title: 'Sertifika Ödemesi',
    loading: 'Yükleniyor...',
    notFound: 'Başvuru bulunamadı veya ödeme gerekmiyor.',
    backToEvent: 'Etkinliğe dön',
    orderSummary: 'Sipariş Özeti',
    product: 'Ürün',
    total: 'Toplam',
    fullName: 'Ad Soyad',
    email: 'E-posta',
    phone: 'Telefon',
    proceed: 'Ödemeye Geç',
    processing: 'İşleniyor...',
    secure: 'Ödeme iyzico altyapısı ile güvenli şekilde alınır.',
    required: 'zorunludur',
    error: 'Ödeme başlatılamadı',
  },
  en: {
    title: 'Certificate Payment',
    loading: 'Loading...',
    notFound: 'Application not found or payment is not required.',
    backToEvent: 'Back to event',
    orderSummary: 'Order Summary',
    product: 'Product',
    total: 'Total',
    fullName: 'Full Name',
    email: 'Email',
    phone: 'Phone',
    proceed: 'Proceed to Payment',
    processing: 'Processing...',
    secure: 'Payment is processed securely via iyzico.',
    required: 'is required',
    error: 'Could not start payment',
  },
};

function EventApplicationCheckoutContent({ locale }: { locale: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = texts[locale as keyof typeof texts] || texts.tr;

  const applicationId = searchParams.get('applicationId') || '';
  const eventSlug = searchParams.get('eventSlug') || '';

  const [application, setApplication] = useState<ApplicationCheckout | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: locale === 'tr' ? 'Dijital Ürün' : 'Digital Product',
    city: 'Istanbul',
    district: '',
    zipCode: '34000',
  });
  const [legalConsent, setLegalConsent] = useState<LegalConsentValues>({
    privacyAccepted: false,
    termsAccepted: false,
  });
  const [legalErrors, setLegalErrors] = useState<LegalConsentErrors>({});

  const eventSegment = locale === 'en' ? 'event' : 'etkinlik';
  const eventHref = eventSlug ? `/${locale}/${eventSegment}/${eventSlug}` : `/${locale}/${eventSegment}`;

  const loadApplication = useCallback(async () => {
    if (!applicationId) {
      setLoading(false);
      setError(t.notFound);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({ eventSlug });
      const res = await fetch(
        `/api/site-applications/applications/${encodeURIComponent(applicationId)}?${params.toString()}`
      );
      const data = await res.json();

      if (!res.ok) {
        if ((data.paid || data.superseded) && (eventSlug || data.eventSlug)) {
          const slug = data.eventSlug || eventSlug;
          const success = new URLSearchParams({
            type: 'event_application',
            applicationId,
          });
          if (slug) success.set('eventSlug', slug);
          if (data.superseded) success.set('alreadyPaid', '1');
          router.replace(`/${locale}/payment-success?${success.toString()}`);
          return;
        }
        if (data.paid) {
          router.replace(
            `/${locale}/payment-success?type=event_application&applicationId=${applicationId}`
          );
          return;
        }
        throw new Error(data.error || t.notFound);
      }

      setApplication(data.application);
      setForm((prev) => ({
        ...prev,
        fullName: data.application.name || prev.fullName,
        email: data.application.email || prev.email,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.notFound);
    } finally {
      setLoading(false);
    }
  }, [applicationId, eventSlug, locale, router, t.notFound]);

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  const handlePayment = async () => {
    if (!application) return;

    if (!form.fullName.trim() || !form.email.trim()) {
      setError(`${t.fullName} / ${t.email} ${t.required}`);
      return;
    }

    const consentErrors = validateLegalConsentClient(legalConsent, locale);
    if (Object.keys(consentErrors).length > 0) {
      setLegalErrors(consentErrors);
      return;
    }
    setLegalErrors({});

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/iyzico-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: application.id,
          courseName: `Sertifika - ${application.eventTitle}`,
          amount: application.amount,
          email: form.email.trim(),
          phone: form.phone.trim() || '+905555555555',
          name: form.fullName.trim(),
          address: form.address,
          city: form.city,
          district: form.district,
          zipCode: form.zipCode,
          locale,
          itemType: 'event_certificate',
          eventSlug: application.eventSlug,
          privacyAccepted: legalConsent.privacyAccepted,
          termsAccepted: legalConsent.termsAccepted,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        // Ödeme zaten alınmışsa tekrar Iyzico'ya gitme
        if (response.status === 409 || /already paid/i.test(String(result.message || ''))) {
          const success = new URLSearchParams({
            type: 'event_application',
            applicationId: application.id,
            alreadyPaid: '1',
          });
          if (application.eventSlug) success.set('eventSlug', application.eventSlug);
          router.replace(`/${locale}/payment-success?${success.toString()}`);
          return;
        }
        throw new Error(result.message || t.error);
      }

      if (result.redirectToDirect && result.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }

      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }

      throw new Error(t.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t.loading}
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 px-4">
        <div className="max-w-md w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-8 text-center">
          <p className="text-neutral-700 dark:text-neutral-300 mb-6">{error || t.notFound}</p>
          <Link href={eventHref} className="inline-flex items-center gap-2 text-[#990000] font-medium">
            <ArrowLeft className="h-4 w-4" />
            {t.backToEvent}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href={eventHref} className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-6 hover:text-[#990000]">
          <ArrowLeft className="h-4 w-4" />
          {t.backToEvent}
        </Link>

        <div className="grid gap-6 md:grid-cols-5">
          <div className="md:col-span-3 space-y-4">
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">{t.title}</h1>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t.fullName}</label>
                  <input
                    value={form.fullName}
                    onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.email}</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.phone}</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">{t.orderSummary}</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-neutral-500">{t.product}</p>
                  <p className="font-medium">Sertifika — {application.eventTitle}</p>
                </div>
                <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3 flex justify-between items-center">
                  <span className="font-medium">{t.total}</span>
                  <span className="text-xl font-bold text-[#990000]">₺{application.amount}</span>
                </div>
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              <div className="mt-6">
                <LegalConsentFields
                  locale={locale}
                  value={legalConsent}
                  onChange={(next) => {
                    setLegalConsent(next);
                    setLegalErrors({});
                  }}
                  errors={legalErrors}
                  idPrefix="event-cert"
                  compact
                />
              </div>

              <button
                type="button"
                onClick={handlePayment}
                disabled={
                  processing ||
                  !legalConsent.privacyAccepted ||
                  !legalConsent.termsAccepted
                }
                className="mt-6 w-full rounded-lg bg-[#990000] hover:bg-[#770000] text-white py-3 font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t.processing}
                  </>
                ) : (
                  t.proceed
                )}
              </button>

              <p className="mt-4 text-xs text-neutral-500 flex items-start gap-2">
                <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                {t.secure}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventApplicationCheckoutPage({ params }: CheckoutPageProps) {
  const { locale } = use(params);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#990000]" />
        </div>
      }
    >
      <EventApplicationCheckoutContent locale={locale} />
    </Suspense>
  );
}
