import 'server-only';

import { getMembershipEntitlementAccess, type MembershipCapability } from './membershipAccess';
import { isCourseAccessAllowed } from './courseAccessPolicy';
import { supabaseAdmin } from './supabaseAdmin';

export class CourseAccessError extends Error {
  constructor(
    message: string,
    public readonly status: 403 | 404,
  ) {
    super(message);
    this.name = 'CourseAccessError';
  }
}

export async function hasUserCourseAccess(params: {
  userId: string;
  courseId: string;
  capability?: MembershipCapability;
}): Promise<boolean> {
  const { data: enrollment, error } = await supabaseAdmin
    .from('myuni_enrollments')
    .select('id')
    .eq('user_id', params.userId)
    .eq('course_id', params.courseId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  const membershipAccess = enrollment
    ? null
    : await getMembershipEntitlementAccess({
        userId: params.userId,
        resourceType: 'course',
        resourceId: params.courseId,
        capability: params.capability ?? 'view',
      });

  return isCourseAccessAllowed({
    hasActiveEnrollment: Boolean(enrollment),
    hasMembershipAccess: membershipAccess?.hasAccess === true,
  });
}

export async function assertUserCanAccessLesson(
  userId: string,
  lessonId: string,
): Promise<{ courseId: string }> {
  const { data: lesson, error } = await supabaseAdmin
    .from('myuni_course_lessons')
    .select('id, section:myuni_course_sections!inner(course_id)')
    .eq('id', lessonId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  if (!lesson) throw new CourseAccessError('Lesson not found', 404);

  const section = Array.isArray(lesson.section) ? lesson.section[0] : lesson.section;
  const courseId = String(section?.course_id || '');
  if (!courseId) throw new CourseAccessError('Course not found', 404);

  const hasAccess = await hasUserCourseAccess({ userId, courseId });
  if (!hasAccess) throw new CourseAccessError('Course access required', 403);

  return { courseId };
}
