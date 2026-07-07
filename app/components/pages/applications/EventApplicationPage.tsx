import DynamicSiteApplicationForm from '@/app/components/forms/DynamicSiteApplicationForm';
import PageLayout from '@/app/components/layout/PageLayout';
import { getEventApplicationPath } from '@/lib/siteApplications/config';
import { getPublicFormByEventSlug } from '@/lib/siteApplications/service';
import { notFound } from 'next/navigation';

interface EventApplicationPageProps {
  locale: string;
  eventSlug?: string;
}

/** Etkinlik sayfasından: /tr/etkinlik/{slug}/basvuru */
export default async function EventApplicationPage({
  locale,
  eventSlug,
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

  const { form } = result;
  const eventSegment = locale === 'en' ? 'event' : 'etkinlik';
  const breadcrumbs = [
    {
      name: locale === 'tr' ? 'Etkinlikler' : 'Events',
      href: `/${locale}/${eventSegment}`,
    },
    {
      name: form.event_title || form.title,
      href: `/${locale}/${eventSegment}/${eventSlug}`,
    },
    {
      name: locale === 'tr' ? 'Başvuru' : 'Application',
      href: getEventApplicationPath(locale, eventSlug),
    },
  ];

  return (
    <PageLayout
      title={form.title}
      description={form.subtitle || undefined}
      locale={locale}
      breadcrumbs={breadcrumbs}
      variant="application"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        <DynamicSiteApplicationForm locale={locale} eventSlug={eventSlug} />
      </div>
    </PageLayout>
  );
}
