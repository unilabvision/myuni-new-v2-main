import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getSiteApplicationsSupabase } from '@/lib/supabaseSiteApplications';
import { siteApplicationsDb } from '@/lib/siteApplications/config';
import { parseAttachmentStorageRef, parseResourceOptions } from '@/lib/siteApplications/files';

type RouteContext = {
  params: Promise<{ slug: string; fieldKey: string }>;
};

const RESOURCE_URL_TTL_SECONDS = 60 * 60;
const RESOURCE_URL_CACHE_SECONDS = 55 * 60;

const getCachedResourceUrl = unstable_cache(
  async (bucket: string, path: string) => {
    const supabase = getSiteApplicationsSupabase();
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, RESOURCE_URL_TTL_SECONDS);
    if (error || !data?.signedUrl) throw error || new Error('Signed URL was not returned');
    return data.signedUrl;
  },
  ['public-form-resource-signed-url-v2'],
  { revalidate: RESOURCE_URL_CACHE_SECONDS }
);

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug, fieldKey } = await context.params;
    const locale = request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'tr';
    const eventSlug = request.nextUrl.searchParams.get('eventSlug')?.trim() || '';
    const slugColumn = locale === 'en' ? 'slug_en' : 'slug_tr';

    const supabase = getSiteApplicationsSupabase();

    let formId: string | null = null;

    if (eventSlug) {
      const { data: event } = await supabase
        .from('myuni_events')
        .select('id')
        .eq('slug', eventSlug)
        .eq('is_active', true)
        .maybeSingle();

      if (!event) {
        return NextResponse.json({ error: 'Form not found' }, { status: 404 });
      }

      const { data: forms } = await supabase
        .from(siteApplicationsDb.forms)
        .select('id')
        .eq('event_id', event.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1);

      formId = forms?.[0]?.id ?? null;
    } else {
      const { data: form } = await supabase
        .from(siteApplicationsDb.forms)
        .select('id')
        .eq(slugColumn, slug)
        .eq('is_active', true)
        .eq('show_on_website', true)
        .maybeSingle();

      formId = form?.id ?? null;
    }

    if (!formId) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const { data: field, error: fieldError } = await supabase
      .from(siteApplicationsDb.formFields)
      .select('field_key, field_type, options')
      .eq('form_id', formId)
      .eq('field_key', fieldKey)
      .maybeSingle();

    if (fieldError) {
      return NextResponse.json({ error: fieldError.message }, { status: 500 });
    }
    if (!field || field.field_type !== 'resource') {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const meta = parseResourceOptions(field.options);
    if (!meta) {
      return NextResponse.json({ error: 'Resource file not uploaded' }, { status: 404 });
    }

    const { bucket, path } = parseAttachmentStorageRef(meta.storageRef);
    const signedUrl = await getCachedResourceUrl(bucket, path).catch((error) => {
      console.error('Resource signed download error:', error);
      return null;
    });

    if (!signedUrl) {
      return NextResponse.json({ error: 'Download URL could not be created' }, { status: 500 });
    }

    return NextResponse.json(
      {
        url: signedUrl,
        fileName: meta.fileName,
        mimeType: meta.mimeType ?? null,
        fileSize: meta.fileSize ?? null,
      },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${RESOURCE_URL_CACHE_SECONDS}, stale-while-revalidate=300`,
        },
      }
    );
  } catch (err) {
    console.error('Public resource download error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
