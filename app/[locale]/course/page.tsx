// app/[locale]/course/page.tsx
import CourseListPage from '../../components/pages/kurs/CourseListPage';

interface CoursePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const resolvedParams = await params;
  
  const courseParams = Promise.resolve({
    locale: resolvedParams.locale,
    courseType: 'course'
  });

  return <CourseListPage params={courseParams} />;
}