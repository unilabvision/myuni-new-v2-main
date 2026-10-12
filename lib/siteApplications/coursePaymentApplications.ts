import 'server-only';

import { getSiteApplicationsSupabase } from '@/lib/supabaseSiteApplications';
import { siteApplicationsDb } from './config';
import {
  markSiteApplicationPaid,
  notifyUniboardPaymentConfirm,
} from './applicationPayments';

export interface CoursePaymentItem {
  id: string;
  type: string;
  slug?: string;
  courseId?: string;
  title?: string;
}

export interface CourseApplicationLink {
  applicationId: string;
  courseId: string;
  formId: string;
}

export interface MissingCourseApplication {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  formId: string;
}

type RequiredCourseForm = MissingCourseApplication;

function getUniqueCourseItems(items: CoursePaymentItem[]): CoursePaymentItem[] {
  const courses = items.filter((item) => item.type === 'course' || item.type === 'tier');
  return Array.from(
    new Map(courses.map((item) => [item.courseId || item.id, item])).values()
  );
}

async function loadRequiredForms(
  items: CoursePaymentItem[]
): Promise<RequiredCourseForm[]> {
  const courseItems = getUniqueCourseItems(items);
  if (courseItems.length === 0) return [];

  const courseIds = courseItems.map((item) => item.courseId || item.id);
  const supabase = getSiteApplicationsSupabase();
  const { data, error } = await supabase
    .from(siteApplicationsDb.forms)
    .select('id, course_id, updated_at')
    .in('course_id', courseIds)
    .eq('is_active', true)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`Course application form lookup failed: ${error.message}`);

  return courseItems.flatMap((item) => {
    const courseId = item.courseId || item.id;
    const form = (data || []).find((row) => row.course_id === courseId);
    if (!form) return [];
    return [{
      courseId,
      courseSlug: String(item.slug || ''),
      courseTitle: String(item.title || ''),
      formId: String(form.id),
    }];
  });
}

export async function resolveCoursePaymentApplications(params: {
  items: CoursePaymentItem[];
  email: string;
}): Promise<{
  links: CourseApplicationLink[];
  missing: MissingCourseApplication | null;
}> {
  const requiredForms = await loadRequiredForms(params.items);
  if (requiredForms.length === 0) return { links: [], missing: null };

  const supabase = getSiteApplicationsSupabase();
  const formIds = requiredForms.map((form) => form.formId);
  const { data, error } = await supabase
    .from(siteApplicationsDb.applications)
    .select('id, form_id, course_id, status, created_at')
    .in('form_id', formIds)
    .ilike('email', params.email.trim())
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Course application lookup failed: ${error.message}`);

  const links: CourseApplicationLink[] = [];
  for (const form of requiredForms) {
    const application = (data || []).find((row) => row.form_id === form.formId);
    if (!application || application.status === 'rejected') {
      return { links, missing: form };
    }

    links.push({
      applicationId: String(application.id),
      courseId: form.courseId,
      formId: form.formId,
    });
  }

  return { links, missing: null };
}

export function getOrderCourseApplicationIds(order: {
  custom_data?: Record<string, unknown> | null;
}): string[] {
  const value = order.custom_data?.courseApplicationIds;
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === 'string' && !!id.trim()))];
}

export async function syncOrderCourseApplications(
  order: { custom_data?: Record<string, unknown> | null },
  orderId: string,
  paymentMethod: string
): Promise<string[]> {
  const errors: string[] = [];

  for (const applicationId of getOrderCourseApplicationIds(order)) {
    const result = await markSiteApplicationPaid(applicationId, orderId, paymentMethod);
    if (!result.success && !result.alreadyPaid) {
      errors.push(`${applicationId}: ${result.error || 'payment update failed'}`);
      continue;
    }
    await notifyUniboardPaymentConfirm(applicationId, orderId);
  }

  return errors;
}
