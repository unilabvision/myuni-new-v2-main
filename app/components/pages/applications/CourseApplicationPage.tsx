import DynamicSiteApplicationForm from '@/app/components/forms/DynamicSiteApplicationForm';
import PageLayout from '@/app/components/layout/PageLayout';
import { getPublicFormByCourseSlug } from '@/lib/siteApplications/service';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface CourseApplicationPageProps {
  locale: string;
  courseSlug: string;
  /** After submit, go to checkout with these params */
  checkoutQuery?: {
    id?: string;
    tierId?: string;
    type?: string;
    ref?: string;
    cartIds?: string;
    mode?: string;
  };
}

export default async function CourseApplicationPage({
  locale,
  courseSlug,
  checkoutQuery,
}: CourseApplicationPageProps) {
  const result = await getPublicFormByCourseSlug(courseSlug, locale);
  const courseSegment = locale === 'en' ? 'course' : 'kurs';
  const courseHref = `/${locale}/${courseSegment}/${courseSlug}`;

  // No published form → skip to checkout (or course page)
  if (!result) {
    if (checkoutQuery?.cartIds && checkoutQuery?.mode === 'cart') {
      redirect(
        `/${locale}/checkout?cartIds=${encodeURIComponent(checkoutQuery.cartIds)}&mode=cart`
      );
    }
    if (checkoutQuery?.id) {
      const qs = new URLSearchParams();
      qs.set('id', checkoutQuery.id);
      if (checkoutQuery.tierId) qs.set('tierId', checkoutQuery.tierId);
      if (checkoutQuery.type) qs.set('type', checkoutQuery.type);
      if (checkoutQuery.ref) qs.set('ref', checkoutQuery.ref);
      redirect(`/${locale}/checkout?${qs.toString()}`);
    }
    redirect(courseHref);
  }

  const { form, course } = result;
  const breadcrumbs = [
    {
      name: locale === 'tr' ? 'Kurslar' : 'Courses',
      href: `/${locale}/${courseSegment}`,
    },
    {
      name: course.title || form.title,
      href: courseHref,
    },
    {
      name: locale === 'tr' ? 'Başvuru' : 'Application',
      href: `/${locale}/${courseSegment}/${courseSlug}/${locale === 'en' ? 'application' : 'basvuru'}`,
    },
  ];

  if (course.is_registration_open === false) {
    return (
      <PageLayout
        title={form.title}
        description={
          locale === 'tr'
            ? 'Bu kurs için kayıt alımı kapalı.'
            : 'Registration is closed for this course.'
        }
        locale={locale}
        breadcrumbs={breadcrumbs}
        variant="application"
      >
        <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
          <p className="text-neutral-600 dark:text-neutral-300">
            {locale === 'tr'
              ? 'Şu an bu kursa başvuru kabul edilmiyor.'
              : 'Applications are not being accepted for this course right now.'}
          </p>
          <Link href={courseHref} className="text-[#990000] underline text-sm">
            {locale === 'tr' ? 'Kursa dön' : 'Back to course'}
          </Link>
        </div>
      </PageLayout>
    );
  }

  const checkoutNext = {
    courseId: checkoutQuery?.id || course.id,
    tierId: checkoutQuery?.tierId,
    type: checkoutQuery?.type || (checkoutQuery?.tierId ? 'tier' : undefined),
    ref: checkoutQuery?.ref,
    cartIds: checkoutQuery?.cartIds,
    mode: checkoutQuery?.mode,
  };

  return (
    <PageLayout
      title={form.title}
      description={
        form.subtitle ||
        (locale === 'tr'
          ? 'Başvurunuzu tamamlayın; ardından ödeme adımına geçeceksiniz.'
          : 'Complete your application; you will proceed to payment next.')
      }
      locale={locale}
      breadcrumbs={breadcrumbs}
      variant="application"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        <DynamicSiteApplicationForm
          locale={locale}
          courseSlug={courseSlug}
          initialForm={form}
          checkoutNext={checkoutNext}
        />
      </div>
    </PageLayout>
  );
}
