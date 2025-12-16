// app/[locale]/course/[slug]/page.tsx
import CourseDetailPage from '../../../components/pages/kurs/[slug]/page';

interface CourseDetailProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export default async function Page({ params }: CourseDetailProps) {
  const resolvedParams = await params;
  
  const courseParams = Promise.resolve({
    locale: resolvedParams.locale,
    courseType: 'course',
    slug: resolvedParams.slug
  });

  return <CourseDetailPage params={courseParams} />;
}