import CourseApplicationPage from '@/app/components/pages/applications/CourseApplicationPage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{
    id?: string;
    tierId?: string;
    type?: string;
    ref?: string;
    next?: string;
    cartIds?: string;
    mode?: string;
  }>;
}

export default async function CourseApplicationRoute({ params, searchParams }: PageProps) {
  const { locale, slug } = await params;
  const sp = await searchParams;
  return (
    <CourseApplicationPage
      locale={locale}
      courseSlug={slug}
      checkoutQuery={{
        id: sp.id,
        tierId: sp.tierId,
        type: sp.type,
        ref: sp.ref,
        cartIds: sp.cartIds,
        mode: sp.mode,
      }}
    />
  );
}
