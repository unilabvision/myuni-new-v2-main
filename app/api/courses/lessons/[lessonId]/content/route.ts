import { auth } from '@clerk/nextjs/server';
import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type RouteContext = {
  params: Promise<{ lessonId: string }>;
};

type NoteRow = {
  id: string;
  lesson_id: string;
  title: string;
  content: string;
  content_type: string;
  file_url: string | null;
  is_ai_generated: boolean;
  order_index: number;
};

const SIGNED_URL_TTL_SECONDS = 60 * 60;
const SIGNED_URL_CACHE_SECONDS = 55 * 60;

const getCachedSignedStorageUrl = unstable_cache(
  async (bucket: string, path: string, downloadName: string) => {
    const options = downloadName ? { download: downloadName } : undefined;
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS, options);

    if (error || !data?.signedUrl) {
      console.error('[lesson-content] signed URL failed:', error?.message);
      return null;
    }

    return data.signedUrl;
  },
  ['lesson-content-signed-url-v2'],
  { revalidate: SIGNED_URL_CACHE_SECONDS }
);

function parseStorageReference(value: string | null): { bucket: string; path: string } | null {
  if (!value || value.startsWith('http://') || value.startsWith('https://')) return null;

  const separatorIndex = value.indexOf('::');
  if (separatorIndex <= 0) return null;

  const bucket = value.slice(0, separatorIndex).trim();
  const path = value.slice(separatorIndex + 2).replace(/^\/+/, '').trim();
  return bucket && path ? { bucket, path } : null;
}

function isAppleDoubleNote(note: NoteRow): boolean {
  const storagePath = parseStorageReference(note.file_url)?.path || '';
  const fileName = storagePath.split('/').pop() || '';
  return note.title.trim().startsWith('._') || fileName.startsWith('._');
}

function normalizeLessonTitle(value: string): string {
  return value
    .trim()
    .replace(/^[._]+/, '')
    .replace(/_TEXTBOOK(?:_TR)?(?:_UNDER_4MB)?$/i, '')
    .replace(/ı/g, 'i')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

async function getFallbackNotes(courseId: string, currentLessonId: string, title: string) {
  const { data: sections } = await supabaseAdmin
    .from('myuni_course_sections')
    .select('id')
    .eq('course_id', courseId)
    .eq('is_active', true);

  const sectionIds = (sections || []).map((section) => section.id);
  if (sectionIds.length === 0) return [];

  const { data: lessons } = await supabaseAdmin
    .from('myuni_course_lessons')
    .select('id, title')
    .in('section_id', sectionIds)
    .eq('is_active', true);

  const normalizedTitle = normalizeLessonTitle(title);
  const matchingLessonIds = (lessons || [])
    .filter(
      (lesson) =>
        lesson.id !== currentLessonId && normalizeLessonTitle(lesson.title) === normalizedTitle
    )
    .map((lesson) => lesson.id);

  if (matchingLessonIds.length === 0) return [];

  const { data: notes } = await supabaseAdmin
    .from('myuni_notes')
    .select('id, lesson_id, title, content, content_type, file_url, is_ai_generated, order_index')
    .in('lesson_id', matchingLessonIds)
    .order('order_index', { ascending: true });

  return ((notes || []) as NoteRow[]).filter((note) => !isAppleDoubleNote(note));
}

async function createSignedStorageUrl(value: string | null, downloadName?: string) {
  const reference = parseStorageReference(value);
  if (!reference) return value;
  return getCachedSignedStorageUrl(reference.bucket, reference.path, downloadName || '');
}

async function resolveNote(note: NoteRow) {
  const contentReference = parseStorageReference(note.content);
  const downloadName = note.title.toLowerCase().endsWith('.html')
    ? note.title
    : `${note.title}.html`;

  const [contentUrl, fileUrl] = await Promise.all([
    contentReference ? createSignedStorageUrl(note.content) : Promise.resolve(null),
    createSignedStorageUrl(note.file_url, downloadName),
  ]);

  return {
    ...note,
    content: contentReference ? '' : note.content,
    content_url: contentUrl,
    file_url: fileUrl,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lessonId } = await context.params;
    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('myuni_course_lessons')
      .select('id, title, duration_minutes, lesson_type, section:myuni_course_sections!inner(course_id)')
      .eq('id', lessonId)
      .eq('is_active', true)
      .maybeSingle();

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    const section = Array.isArray(lesson.section) ? lesson.section[0] : lesson.section;
    const courseId = section?.course_id;
    if (!courseId) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const { data: enrollment } = await supabaseAdmin
      .from('myuni_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!enrollment) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [videosResult, notesResult, quicksResult] = await Promise.all([
      supabaseAdmin
        .from('myuni_videos')
        .select(
          'id, lesson_id, title, description, vimeo_id, video_url, thumbnail_url, duration_seconds, order_index, vimeo_hash, vimeo_embed_url'
        )
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true }),
      supabaseAdmin
        .from('myuni_notes')
        .select('id, lesson_id, title, content, content_type, file_url, is_ai_generated, order_index')
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true }),
      supabaseAdmin
        .from('myuni_quicks')
        .select(
          'id, lesson_id, title, description, quick_type, config, order_index, created_at, updated_at'
        )
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true }),
    ]);

    const queryError = videosResult.error || notesResult.error || quicksResult.error;
    if (queryError) throw queryError;

    const notes = (notesResult.data || []) as NoteRow[];
    const usableNotes = notes.filter((note) => !isAppleDoubleNote(note));
    const selectedNotes =
      usableNotes.length > 0
        ? usableNotes
        : await getFallbackNotes(courseId, lessonId, lesson.title);

    return NextResponse.json(
      {
        lesson: {
          id: lesson.id,
          title: lesson.title,
          duration_minutes: lesson.duration_minutes,
          lesson_type: lesson.lesson_type,
        },
        videos: videosResult.data || [],
        notes: await Promise.all(selectedNotes.map(resolveNote)),
        quicks: quicksResult.data || [],
      },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    console.error(
      '[lesson-content] request failed:',
      error instanceof Error ? error.message : error
    );
    return NextResponse.json({ error: 'Content could not be loaded' }, { status: 500 });
  }
}
