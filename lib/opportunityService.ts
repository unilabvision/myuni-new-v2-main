import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type {
  CareerTag,
  LocalizedText,
  Opportunity,
  OpportunityWithMatch,
  UserCourseCompletion,
} from '@/lib/types/opportunity';

export function localizeText(
  value: LocalizedText | string | null | undefined,
  locale: string
): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale] || value.tr || value.en || '';
}

async function getUserCompletedCourses(
  userId: string
): Promise<UserCourseCompletion[]> {
  const [enrollmentsRes, certificatesRes, courseTagsRes] = await Promise.all([
    supabaseAdmin
      .from('myuni_enrollments')
      .select('course_id, progress_percentage, course:myuni_courses(id, title)')
      .eq('user_id', userId)
      .eq('is_active', true),
    supabaseAdmin
      .from('myuni_certificates')
      .select('course_id, course:myuni_courses(id, title)')
      .eq('user_id', userId)
      .eq('is_active', true),
    supabaseAdmin.from('myuni_course_career_tags').select('course_id, tag_id'),
  ]);

  const certifiedIds = new Set(
    (certificatesRes.data || []).map((r) => r.course_id as string)
  );

  const completedCourseIds = new Set<string>();
  for (const row of enrollmentsRes.data || []) {
    const courseId = row.course_id as string;
    const progress = Number(row.progress_percentage) || 0;
    if (progress >= 100 || certifiedIds.has(courseId)) {
      completedCourseIds.add(courseId);
    }
  }
  for (const id of certifiedIds) completedCourseIds.add(id);

  const tagsByCourse = new Map<string, string[]>();
  for (const row of courseTagsRes.data || []) {
    const cid = row.course_id as string;
    const list = tagsByCourse.get(cid) || [];
    list.push(row.tag_id as string);
    tagsByCourse.set(cid, list);
  }

  const result: UserCourseCompletion[] = [];
  const seen = new Set<string>();

  for (const row of enrollmentsRes.data || []) {
    const courseId = row.course_id as string;
    if (!completedCourseIds.has(courseId) || seen.has(courseId)) continue;
    seen.add(courseId);
    const course = row.course as { id: string; title: string } | null;
    result.push({
      course_id: courseId,
      course_title: course?.title || '',
      tag_ids: tagsByCourse.get(courseId) || [],
    });
  }

  for (const row of certificatesRes.data || []) {
    const courseId = row.course_id as string;
    if (!completedCourseIds.has(courseId) || seen.has(courseId)) continue;
    seen.add(courseId);
    const course = row.course as { id: string; title: string } | null;
    result.push({
      course_id: courseId,
      course_title: course?.title || '',
      tag_ids: tagsByCourse.get(courseId) || [],
    });
  }

  return result;
}

async function loadOpportunityRelations(
  opportunities: Opportunity[]
): Promise<Opportunity[]> {
  if (opportunities.length === 0) return [];

  const ids = opportunities.map((o) => o.id);

  const [tagsRes, coursesRes, allTagsRes] = await Promise.all([
    supabaseAdmin
      .from('myuni_opportunity_career_tags')
      .select('opportunity_id, tag_id')
      .in('opportunity_id', ids),
    supabaseAdmin
      .from('myuni_opportunity_courses')
      .select('opportunity_id, course_id')
      .in('opportunity_id', ids),
    supabaseAdmin.from('myuni_career_tags').select('*'),
  ]);

  const tagMap = new Map(
    (allTagsRes.data || []).map((t) => [t.id as string, t as CareerTag])
  );

  const tagsByOpp = new Map<string, CareerTag[]>();
  for (const row of tagsRes.data || []) {
    const oid = row.opportunity_id as string;
    const tag = tagMap.get(row.tag_id as string);
    if (!tag) continue;
    const list = tagsByOpp.get(oid) || [];
    list.push(tag);
    tagsByOpp.set(oid, list);
  }

  const coursesByOpp = new Map<string, string[]>();
  for (const row of coursesRes.data || []) {
    const oid = row.opportunity_id as string;
    const list = coursesByOpp.get(oid) || [];
    list.push(row.course_id as string);
    coursesByOpp.set(oid, list);
  }

  return opportunities.map((o) => ({
    ...o,
    tags: tagsByOpp.get(o.id) || [],
    course_ids: coursesByOpp.get(o.id) || [],
  }));
}

function computeMatch(
  opportunity: Opportunity,
  completedCourses: UserCourseCompletion[],
  locale: string
): Pick<
  OpportunityWithMatch,
  'is_recommended' | 'can_apply' | 'match_reasons' | 'matching_course_ids'
> {
  const oppTagIds = new Set((opportunity.tags || []).map((t) => t.id));
  const manualCourseIds = new Set(opportunity.course_ids || []);

  const matchingCourses = completedCourses.filter((cc) => {
    if (manualCourseIds.has(cc.course_id)) return true;
    if (oppTagIds.size === 0 && manualCourseIds.size === 0) return false;
    return cc.tag_ids.some((tid) => oppTagIds.has(tid));
  });

  const matchingIds = matchingCourses.map((c) => c.course_id);
  const isRecommended = matchingIds.length > 0;
  const canApply = matchingIds.length > 0;

  const reasons = matchingCourses.map((c) => c.course_title).filter(Boolean);
  if (reasons.length === 0 && (opportunity.tags?.length ?? 0) > 0) {
    const tagNames = (opportunity.tags || [])
      .map((t) => localizeText(t.name, locale))
      .filter(Boolean);
    if (tagNames.length > 0) {
      return {
        is_recommended: false,
        can_apply: false,
        match_reasons: [],
        matching_course_ids: [],
      };
    }
  }

  return {
    is_recommended: isRecommended,
    can_apply: canApply,
    match_reasons: reasons,
    matching_course_ids: matchingIds,
  };
}

export async function getActiveOpportunities(
  locale = 'tr'
): Promise<Opportunity[]> {
  const { data, error } = await supabaseAdmin
    .from('myuni_opportunities')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[opportunityService] getActiveOpportunities:', error);
    return [];
  }

  return loadOpportunityRelations((data || []) as Opportunity[]);
}

export async function getOpportunityBySlug(
  slug: string
): Promise<Opportunity | null> {
  const { data, error } = await supabaseAdmin
    .from('myuni_opportunities')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return null;
  const [withRelations] = await loadOpportunityRelations([data as Opportunity]);
  return withRelations || null;
}

export async function getOpportunitiesForUser(
  userId: string,
  locale = 'tr'
): Promise<OpportunityWithMatch[]> {
  const [opportunities, completedCourses, appsRes] = await Promise.all([
    getActiveOpportunities(locale),
    getUserCompletedCourses(userId),
    supabaseAdmin
      .from('myuni_applications')
      .select('context_id, status')
      .eq('context_type', 'opportunity')
      .eq('user_id', userId),
  ]);

  const appStatusByOpp = new Map(
    (appsRes.data || []).map((a) => [
      a.context_id as string,
      a.status as string,
    ])
  );

  const withMatch: OpportunityWithMatch[] = opportunities.map((opp) => {
    const match = computeMatch(opp, completedCourses, locale);
    return {
      ...opp,
      ...match,
      user_application_status:
        (appStatusByOpp.get(opp.id) as OpportunityWithMatch['user_application_status']) ??
        null,
    };
  });

  return withMatch.sort((a, b) => {
    if (a.is_recommended !== b.is_recommended) {
      return a.is_recommended ? -1 : 1;
    }
    if (a.is_featured !== b.is_featured) {
      return a.is_featured ? -1 : 1;
    }
    return a.order_index - b.order_index;
  });
}

export async function getOpportunityWithMatchForUser(
  slug: string,
  userId: string | null,
  locale = 'tr'
): Promise<OpportunityWithMatch | null> {
  const opp = await getOpportunityBySlug(slug);
  if (!opp) return null;

  if (!userId) {
    return {
      ...opp,
      is_recommended: false,
      can_apply: false,
      match_reasons: [],
      matching_course_ids: [],
      user_application_status: null,
    };
  }

  const completedCourses = await getUserCompletedCourses(userId);
  const match = computeMatch(opp, completedCourses, locale);

  const { data: app } = await supabaseAdmin
    .from('myuni_applications')
    .select('status')
    .eq('context_type', 'opportunity')
    .eq('context_id', opp.id)
    .eq('user_id', userId)
    .maybeSingle();

  return {
    ...opp,
    ...match,
    user_application_status:
      (app?.status as OpportunityWithMatch['user_application_status']) ?? null,
  };
}

export async function canUserApply(
  userId: string,
  opportunityId: string
): Promise<{ allowed: boolean; reasons: string[] }> {
  const { data: opp } = await supabaseAdmin
    .from('myuni_opportunities')
    .select('*')
    .eq('id', opportunityId)
    .eq('is_active', true)
    .maybeSingle();

  if (!opp) return { allowed: false, reasons: [] };

  const [withRelations] = await loadOpportunityRelations([opp as Opportunity]);
  const completedCourses = await getUserCompletedCourses(userId);
  const match = computeMatch(withRelations, completedCourses, 'tr');

  return {
    allowed: match.can_apply,
    reasons: match.match_reasons,
  };
}

export async function getUserApplications(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('myuni_applications')
    .select('*')
    .eq('context_type', 'opportunity')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[opportunityService] getUserApplications:', error);
    return [];
  }

  const apps = data || [];
  if (!apps.length) return [];

  const oppIds = apps.map((a) => a.context_id);
  const { data: opps } = await supabaseAdmin
    .from('myuni_opportunities')
    .select('*')
    .in('id', oppIds);

  const oppMap = new Map((opps || []).map((o) => [o.id as string, o]));

  return apps.map((app) => ({
    ...app,
    opportunity_id: app.context_id,
    opportunity: oppMap.get(app.context_id as string) || null,
  }));
}

export async function getAllCareerTags(): Promise<CareerTag[]> {
  const { data, error } = await supabaseAdmin
    .from('myuni_career_tags')
    .select('*')
    .order('slug');

  if (error) return [];
  return (data || []) as CareerTag[];
}

export async function getAllCoursesForAdmin() {
  const { data, error } = await supabaseAdmin
    .from('myuni_courses')
    .select('id, title, slug')
    .eq('is_active', true)
    .order('title');

  if (error) return [];
  return data || [];
}
