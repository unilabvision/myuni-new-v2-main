import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSiteApplicationsSupabase } from '@/lib/supabaseSiteApplications';
import {
  buildAttachmentStoragePath,
  siteApplicationsDb,
  validateAttachmentFile,
} from '@/lib/siteApplications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const formSlug = String(body.formSlug || '').trim();
    const eventSlug = String(body.eventSlug || '').trim() || undefined;
    const locale = body.locale === 'en' ? 'en' : 'tr';

    if (!formSlug && !eventSlug) {
      return NextResponse.json({ error: 'Form slug or event slug required' }, { status: 400 });
    }

    const supabase = getSiteApplicationsSupabase();
    let form: { id: string; allows_attachment: boolean } | null = null;
    let storageSlug = formSlug;

    if (eventSlug) {
      const { data: event } = await supabase
        .from('myuni_events')
        .select('id, slug')
        .eq('slug', eventSlug)
        .eq('is_active', true)
        .maybeSingle();

      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }

      const { data, error } = await supabase
        .from(siteApplicationsDb.forms)
        .select('id, allows_attachment, slug_tr, slug_en')
        .eq('event_id', event.id)
        .eq('is_active', true)
        .eq('show_on_website', true)
        .maybeSingle();

      if (error || !data) {
        return NextResponse.json({ error: 'Form not found' }, { status: 404 });
      }

      form = data;
      storageSlug = event.slug;
    } else {
      const slugColumn = locale === 'en' ? 'slug_en' : 'slug_tr';
      const { data, error: formError } = await supabase
        .from(siteApplicationsDb.forms)
        .select('id, allows_attachment')
        .eq(slugColumn, formSlug)
        .eq('is_active', true)
        .eq('show_on_website', true)
        .maybeSingle();

      if (formError || !data) {
        return NextResponse.json({ error: 'Form not found' }, { status: 404 });
      }
      form = data;
    }

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (!form.allows_attachment) {
      return NextResponse.json({ error: 'Attachments not allowed' }, { status: 400 });
    }

    const fileName = String(body.fileName || '').trim();
    const fileSize = Number(body.fileSize);
    const mimeType = String(body.mimeType || 'application/octet-stream').trim();

    if (!fileName || !Number.isFinite(fileSize)) {
      return NextResponse.json({ error: 'Invalid file metadata' }, { status: 400 });
    }

    const validationError = validateAttachmentFile({
      name: fileName,
      size: fileSize,
    } as File);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const draftId = randomUUID();
    const { bucket, objectPath, storageRef } = buildAttachmentStoragePath(
      storageSlug,
      draftId,
      fileName
    );

    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(objectPath);

    if (error || !data?.signedUrl) {
      console.error('Signed upload URL error:', error);
      return NextResponse.json({ error: 'Upload URL could not be created' }, { status: 500 });
    }

    return NextResponse.json({
      bucket,
      objectPath,
      storageRef,
      signedUrl: data.signedUrl,
      token: data.token,
      mimeType,
    });
  } catch (err) {
    console.error('Upload URL error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
