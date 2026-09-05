import 'server-only';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type MentorshipMode = 'online' | 'hybrid' | 'onsite';
export type MentorshipType =
  | 'general'
  | 'career'
  | 'academic'
  | 'technical'
  | 'entrepreneurship';

type Localized = { tr?: string; en?: string; [key: string]: string | undefined };

export interface PublicMentorship {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  mentor_name: string | null;
  mentor_title: string | null;
  mentor_bio: string;
  mentor_image_url: string | null;
  mentor_linkedin: string | null;
  mentorship_type: MentorshipType;
  mode: MentorshipMode;
  location_name: string | null;
  application_deadline: string | null;
  start_date: string | null;
  end_date: string | null;
  max_mentees: number | null;
  current_mentees: number;
  is_application_open: boolean;
  thumbnail_url: string | null;
  banner_url: string | null;
  tags: string[] | null;
  is_featured: boolean;
  order_index: number;
  url: string;
  application_url: string;
}

function getLocalized(value: unknown, locale: string, fallback = ''): string {
  if (typeof value === 'string') return value.trim() || fallback;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Localized;
    const lang = locale === 'en' ? 'en' : 'tr';
    return (
      obj[lang] ||
      obj.tr ||
      obj.en ||
      Object.values(obj).find(Boolean) ||
      fallback
    ).trim();
  }
  return fallback;
}

function listPath(locale: string): string {
  return locale === 'en' ? 'mentorship' : 'mentorluk';
}

function mapRow(row: Record<string, unknown>, locale: string): PublicMentorship {
  const slug = String(row.slug || '');
  const segment = listPath(locale);
  return {
    id: String(row.id),
    slug,
    title: getLocalized(row.title, locale, slug),
    summary: getLocalized(row.summary, locale),
    description: getLocalized(row.description, locale),
    mentor_name: (row.mentor_name as string) || null,
    mentor_title: (row.mentor_title as string) || null,
    mentor_bio: getLocalized(row.mentor_bio, locale),
    mentor_image_url: (row.mentor_image_url as string) || null,
    mentor_linkedin: (row.mentor_linkedin as string) || null,
    mentorship_type: (row.mentorship_type as MentorshipType) || 'general',
    mode: (row.mode as MentorshipMode) || 'online',
    location_name: (row.location_name as string) || null,
    application_deadline: (row.application_deadline as string) || null,
    start_date: (row.start_date as string) || null,
    end_date: (row.end_date as string) || null,
    max_mentees: (row.max_mentees as number) ?? null,
    current_mentees: Number(row.current_mentees || 0),
    is_application_open: row.is_application_open !== false,
    thumbnail_url: (row.thumbnail_url as string) || null,
    banner_url: (row.banner_url as string) || null,
    tags: (row.tags as string[]) || null,
    is_featured: Boolean(row.is_featured),
    order_index: Number(row.order_index || 0),
    url: `/${locale}/${segment}/${slug}`,
    application_url: `/${locale}/${segment}/${slug}/basvuru`,
  };
}

export async function getPublicMentorships(
  locale: string = 'tr',
  options?: { featuredOnly?: boolean }
): Promise<PublicMentorship[]> {
  let query = supabaseAdmin
    .from('mentorships')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false });

  if (options?.featuredOnly) {
    query = query.eq('is_featured', true);
  }

  const { data, error } = await query;
  if (error) {
    // Table may not exist yet before SQL migration
    console.error('[mentorshipService] list error:', error.message);
    throw error;
  }

  return (data || []).map((row) => mapRow(row as Record<string, unknown>, locale));
}

export async function getPublicMentorshipBySlug(
  slug: string,
  locale: string = 'tr'
): Promise<PublicMentorship | null> {
  const { data, error } = await supabaseAdmin
    .from('mentorships')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('[mentorshipService] detail error:', error.message);
    throw error;
  }
  if (!data) return null;
  return mapRow(data as Record<string, unknown>, locale);
}

export type MentorshipApplyInput = {
  mentorship_id?: string;
  mentorship_slug?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  school?: string | null;
  department?: string | null;
  grade?: string | null;
  linkedin_url?: string | null;
  motivation?: string | null;
  goals?: string | null;
  experience?: string | null;
  locale?: string | null;
  source?: string | null;
};

export async function submitMentorshipApplication(input: MentorshipApplyInput) {
  const firstName = input.first_name?.trim();
  const lastName = input.last_name?.trim();
  const email = input.email?.trim().toLowerCase();

  if (!firstName || !lastName || !email) {
    return { ok: false as const, status: 400, error: 'first_name, last_name ve email zorunludur' };
  }
  if (!input.mentorship_id && !input.mentorship_slug) {
    return {
      ok: false as const,
      status: 400,
      error: 'mentorship_id veya mentorship_slug zorunludur',
    };
  }

  let mentorshipId = input.mentorship_id;
  let mentorshipQuery = supabaseAdmin
    .from('mentorships')
    .select('id, is_active, is_application_open, max_mentees, current_mentees');

  if (mentorshipId) {
    mentorshipQuery = mentorshipQuery.eq('id', mentorshipId);
  } else {
    mentorshipQuery = mentorshipQuery.eq('slug', input.mentorship_slug!);
  }

  const { data: mentorship, error: mErr } = await mentorshipQuery.maybeSingle();
  if (mErr) {
    return { ok: false as const, status: 500, error: mErr.message };
  }
  if (!mentorship || !mentorship.is_active) {
    return { ok: false as const, status: 404, error: 'Mentörlük bulunamadı' };
  }
  if (!mentorship.is_application_open) {
    return { ok: false as const, status: 400, error: 'Başvurular kapalı' };
  }
  if (
    mentorship.max_mentees != null &&
    mentorship.current_mentees >= mentorship.max_mentees
  ) {
    return { ok: false as const, status: 400, error: 'Kontenjan dolu' };
  }

  mentorshipId = mentorship.id as string;

  const { data: duplicate } = await supabaseAdmin
    .from('mentorship_applications')
    .select('id')
    .eq('mentorship_id', mentorshipId)
    .eq('email', email)
    .not('status', 'eq', 'withdrawn')
    .maybeSingle();

  if (duplicate) {
    return {
      ok: false as const,
      status: 409,
      error: 'Bu e-posta ile zaten başvuru yapılmış',
    };
  }

  const { data, error } = await supabaseAdmin
    .from('mentorship_applications')
    .insert({
      mentorship_id: mentorshipId,
      first_name: firstName,
      last_name: lastName,
      email,
      phone: input.phone?.trim() || null,
      school: input.school?.trim() || null,
      department: input.department?.trim() || null,
      grade: input.grade?.trim() || null,
      linkedin_url: input.linkedin_url?.trim() || null,
      motivation: input.motivation?.trim() || null,
      goals: input.goals?.trim() || null,
      experience: input.experience?.trim() || null,
      locale: input.locale === 'en' ? 'en' : 'tr',
      source: input.source || 'website',
      status: 'pending',
    })
    .select('id, status, created_at')
    .single();

  if (error) {
    return { ok: false as const, status: 500, error: error.message };
  }

  await supabaseAdmin.from('mentorship_application_status_history').insert({
    application_id: data.id,
    from_status: null,
    to_status: 'pending',
    changed_by: null,
    note: 'Public application submitted via myunilab.net',
  });

  return { ok: true as const, status: 201, application: data };
}
