'use client';

import { use, useMemo } from 'react';
import CourseListPage from '@/app/components/pages/kurs/CourseListPage';

interface MentorshipListPageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Mentorship catalog — reuses course list UI filtered to program_type=mentorship.
 * Detail/application flows use existing /kurs|/course/[slug] routes.
 */
export default function MentorshipListPage({ params }: MentorshipListPageProps) {
  const resolved = use(params);
  const courseParams = useMemo(
    () =>
      Promise.resolve({
        locale: resolved.locale,
        courseType: resolved.locale === 'en' ? 'mentorship' : 'mentorluk',
      }),
    [resolved.locale]
  );

  return <CourseListPage params={courseParams} variant="mentorship" />;
}
