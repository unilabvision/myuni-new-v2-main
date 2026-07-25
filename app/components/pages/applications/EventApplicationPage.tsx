import DynamicSiteApplicationForm from '@/app/components/forms/DynamicSiteApplicationForm';
import PageLayout from '@/app/components/layout/PageLayout';
import { getEventApplicationPath } from '@/lib/siteApplications/config';
import type { RegistrationTier } from '@/lib/siteApplications/packages';
import { getPublicFormByEventSlug } from '@/lib/siteApplications/service';
import { isEventRegistrationOpen } from '@/lib/events/eventRegistration';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface EventApplicationPageProps {
  locale: string;
  eventSlug?: string;
  registrationTier?: RegistrationTier;
}

/** Etkinlik sayfasından: /tr/etkinlik/{slug}/basvuru */
export default async function EventApplicationPage({
  locale,
  eventSlug,
  registrationTier = 'free',
}: EventApplicationPageProps) {
  if (!eventSlug) {
    const fallbackSlug = locale === 'en' ? 'event-application' : 'etkinlik-basvuru';
    return (
      <PageLayout
        title={locale === 'tr' ? 'Etkinlik Başvurusu' : 'Event Application'}
        description={
          locale === 'tr'
            ? 'Lütfen başvurmak istediğiniz etkinlik sayfasından devam edin.'
            : 'Please continue from the event page you want to apply for.'
        }
        locale={locale}
        variant="application"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10">
          <DynamicSiteApplicationForm locale={locale} formSlug={fallbackSlug} />
        </div>
      </PageLayout>
    );
  }

  const result = await getPublicFormByEventSlug(eventSlug, locale);
  if (!result) {
    notFound();
  }

  const { form, event } = result;
  const eventSegment = locale === 'en' ? 'event' : 'etkinlik';
  const eventHref = `/${locale}/${eventSegment}/${eventSlug}`;
  const breadcrumbs = [
    {
      name: locale === 'tr' ? 'Etkinlikler' : 'Events',
      href: `/${locale}/${eventSegment}`,
    },
    {
      name: form.event_title || form.title,
      href: eventHref,
    },
    {
      name: locale === 'tr' ? 'Başvuru' : 'Application',
      href: getEventApplicationPath(locale, eventSlug),
    },
  ];

  const registrationOpen = isEventRegistrationOpen({
    is_registration_open: event?.is_registration_open,
    registration_deadline: event?.registration_deadline,
  });

  if (!registrationOpen) {
    return (
      <PageLayout
        title={form.title}
        description={
          locale === 'tr'
            ? 'Bu etkinlik için kayıt alımı kapalı.'
            : 'Registration is closed for this event.'
        }
        locale={locale}
        breadcrumbs={breadcrumbs}
        variant="application"
      >
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-12 md:py-16 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
            {locale === 'tr' ? 'Kayıt Kapalı' : 'Registration Closed'}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8">
            {locale === 'tr'
              ? 'Bu etkinlik sitede görünür ancak şu an yeni kayıt kabul edilmiyor.'
              : 'This event remains visible on the site, but new registrations are not accepted right now.'}
          </p>
          <Link
            href={eventHref}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-sm bg-[#990000] text-white text-sm font-medium hover:bg-[#7a0000] transition-colors"
          >
            {locale === 'tr' ? 'Etkinlik sayfasına dön' : 'Back to event page'}
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={form.title}
      description={form.subtitle || undefined}
      locale={locale}
      breadcrumbs={breadcrumbs}
      variant="application"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        <DynamicSiteApplicationForm
          locale={locale}
          eventSlug={eventSlug}
          initialForm={form}
          registrationTier={registrationTier}
        />
      </div>
    </PageLayout>
  );
}
