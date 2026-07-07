import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  sendApplicationReceivedEmails,
  sendApplicationStatusChangeEmail,
} from '@/lib/applicationEmailService';
import {
  canUserApply,
  getOpportunityBySlug,
  localizeText,
} from '@/lib/opportunityService';
import type {
  ApplicationContextType,
  ApplicationRecord,
  ApplicationStatus,
  LocalizedText,
} from '@/lib/types/application';

const VALID_STATUSES: ApplicationStatus[] = [
  'pending',
  'under_review',
  'accepted',
  'rejected',
  'cancelled',
];

export interface ResolvedContext {
  contextType: ApplicationContextType;
  contextId: string;
  contextSlug: string | null;
  contextTitle: LocalizedText | null;
  formConfigId: string | null;
  requiresAuth: boolean;
  deadline: string | null;
}

export interface SubmitApplicationInput {
  contextType: ApplicationContextType;
  contextId?: string;
  contextSlug?: string;
  userId: string;
  applicantEmail: string | null;
  submissionData: Record<string, unknown>;
  cvStoragePath?: string | null;
  cvFileName?: string | null;
  userAgent?: string | null;
  formConfigId?: string | null;
}

function applicantNameFromSubmission(data: Record<string, unknown>): string {
  return (
    [data.first_name, data.last_name].filter(Boolean).join(' ') ||
    String(data.ad_soyad || data.full_name || data.name || 'Aday')
  );
}

export function resolveContextTitle(
  record: ApplicationRecord,
  locale = 'tr'
): string {
  if (record.context_title) {
    return localizeText(record.context_title as LocalizedText, locale);
  }
  if (record.opportunity?.title) {
    return localizeText(record.opportunity.title as LocalizedText, locale);
  }
  return record.context_slug || record.context_id;
}

export async function resolveApplicationContext(
  contextType: ApplicationContextType,
  options: { contextId?: string; contextSlug?: string }
): Promise<ResolvedContext | null> {
  if (contextType === 'opportunity') {
    let opportunity = null;
    if (options.contextSlug) {
      opportunity = await getOpportunityBySlug(options.contextSlug);
    } else if (options.contextId) {
      const { data } = await supabaseAdmin
        .from('myuni_opportunities')
        .select('*')
        .eq('id', options.contextId)
        .eq('is_active', true)
        .maybeSingle();
      opportunity = data;
    }
    if (!opportunity) return null;
    return {
      contextType: 'opportunity',
      contextId: opportunity.id as string,
      contextSlug: opportunity.slug as string,
      contextTitle: (opportunity.title as LocalizedText) || null,
      formConfigId: (opportunity.form_config_id as string) || null,
      requiresAuth: true,
      deadline: (opportunity.application_deadline as string) || null,
    };
  }

  if (contextType === 'event' && options.contextId) {
    const { data: event } = await supabaseAdmin
      .from('myuni_events')
      .select('id, slug, title')
      .eq('id', options.contextId)
      .maybeSingle();
    if (!event) return null;
    return {
      contextType: 'event',
      contextId: event.id as string,
      contextSlug: (event.slug as string) || null,
      contextTitle: (event.title as LocalizedText) || null,
      formConfigId: null,
      requiresAuth: true,
      deadline: null,
    };
  }

  if (
    (contextType === 'club' || contextType === 'generic' || contextType === 'campaign') &&
    options.contextId
  ) {
    return {
      contextType,
      contextId: options.contextId,
      contextSlug: options.contextSlug || null,
      contextTitle: null,
      formConfigId: options.contextId,
      requiresAuth: contextType !== 'generic',
      deadline: null,
    };
  }

  return null;
}

export async function checkApplicationEligibility(
  context: ResolvedContext,
  userId: string
): Promise<{ allowed: boolean; reasons: string[] }> {
  if (context.contextType === 'opportunity') {
    const result = await canUserApply(userId, context.contextId);
    return { allowed: result.allowed, reasons: result.reasons };
  }

  if (context.contextType === 'event') {
    return { allowed: true, reasons: [] };
  }

  return { allowed: true, reasons: [] };
}

export async function submitApplication(
  input: SubmitApplicationInput
): Promise<{ success: boolean; application?: ApplicationRecord; error?: string }> {
  const context = await resolveApplicationContext(input.contextType, {
    contextId: input.contextId,
    contextSlug: input.contextSlug,
  });

  if (!context) {
    return { success: false, error: 'Başvuru kaynağı bulunamadı' };
  }

  if (context.deadline && new Date(context.deadline) < new Date()) {
    return { success: false, error: 'Başvuru süresi dolmuş' };
  }

  const { allowed } = await checkApplicationEligibility(context, input.userId);
  if (!allowed) {
    return {
      success: false,
      error: 'Bu başvuru için gerekli koşulları sağlamıyorsunuz',
    };
  }

  const { data: existing } = await supabaseAdmin
    .from('myuni_applications')
    .select('id')
    .eq('context_type', context.contextType)
    .eq('context_id', context.contextId)
    .eq('user_id', input.userId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'Bu kaynağa zaten başvurdunuz' };
  }

  const { data, error } = await supabaseAdmin
    .from('myuni_applications')
    .insert({
      context_type: context.contextType,
      context_id: context.contextId,
      context_slug: context.contextSlug,
      context_title: context.contextTitle,
      form_config_id: input.formConfigId || context.formConfigId,
      user_id: input.userId,
      applicant_email: input.applicantEmail,
      submission_data: input.submissionData,
      cv_storage_path: input.cvStoragePath || null,
      cv_file_name: input.cvFileName || null,
      user_agent: input.userAgent || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error || !data) {
    console.error('[applicationService] submit:', error);
    return { success: false, error: 'Başvuru kaydedilemedi' };
  }

  if (input.applicantEmail) {
    await sendApplicationReceivedEmails({
      applicantEmail: input.applicantEmail,
      applicantName: applicantNameFromSubmission(input.submissionData),
      contextType: context.contextType,
      contextTitle: context.contextTitle,
      applicationId: data.id as string,
      submissionData: input.submissionData,
      cvFileName: input.cvFileName,
    });
  }

  return { success: true, application: data as ApplicationRecord };
}

export async function getUserApplications(
  userId: string,
  contextType?: ApplicationContextType
) {
  let query = supabaseAdmin
    .from('myuni_applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (contextType) query = query.eq('context_type', contextType);

  const { data, error } = await query;
  if (error) {
    console.error('[applicationService] getUserApplications:', error);
    return [];
  }

  return enrichApplications((data || []) as ApplicationRecord[]);
}

export async function listApplicationsForAdmin(filters: {
  contextType?: ApplicationContextType;
  status?: ApplicationStatus;
  contextId?: string;
  limit?: number;
}) {
  const limit = Math.min(filters.limit || 100, 500);

  let query = supabaseAdmin
    .from('myuni_applications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters.contextType) query = query.eq('context_type', filters.contextType);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.contextId) query = query.eq('context_id', filters.contextId);

  const { data, error } = await query;
  if (error) {
    console.error('[applicationService] listApplicationsForAdmin:', error);
    return [];
  }

  const { data: counts } = await supabaseAdmin
    .from('myuni_applications')
    .select('status, context_type');

  const statusCounts: Record<string, number> = {};
  const contextCounts: Record<string, number> = {};
  for (const row of counts || []) {
    const s = row.status as string;
    const c = row.context_type as string;
    statusCounts[s] = (statusCounts[s] || 0) + 1;
    contextCounts[c] = (contextCounts[c] || 0) + 1;
  }

  const applications = await enrichApplications(
    (data || []) as ApplicationRecord[]
  );

  return { applications, statusCounts, contextCounts };
}

async function enrichApplications(
  rows: ApplicationRecord[]
): Promise<ApplicationRecord[]> {
  const oppIds = rows
    .filter((r) => r.context_type === 'opportunity')
    .map((r) => r.context_id);

  let oppMap = new Map<string, ApplicationRecord['opportunity']>();
  if (oppIds.length) {
    const { data: opps } = await supabaseAdmin
      .from('myuni_opportunities')
      .select('id, slug, title, company_name')
      .in('id', oppIds);
    oppMap = new Map(
      (opps || []).map((o) => [
        o.id as string,
        o as ApplicationRecord['opportunity'],
      ])
    );
  }

  return rows.map((row) => {
    const opportunity =
      row.context_type === 'opportunity'
        ? oppMap.get(row.context_id) || {
            id: row.context_id,
            slug: row.context_slug || '',
            title: row.context_title || undefined,
          }
        : undefined;
    const enriched: ApplicationRecord = { ...row, opportunity };
    return {
      ...enriched,
      context_label: resolveContextTitle(enriched),
    };
  });
}

export async function getApplicationById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('myuni_applications')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;

  const [enriched] = await enrichApplications([data as ApplicationRecord]);

  const { data: history } = await supabaseAdmin
    .from('myuni_application_status_history')
    .select('*')
    .eq('application_id', id)
    .order('created_at', { ascending: false });

  return { application: enriched, history: history || [] };
}

export async function updateApplicationStatus(
  id: string,
  updates: {
    status?: ApplicationStatus;
    adminNotes?: string;
    notifyApplicant?: boolean;
  },
  admin: { userId: string; email: string }
) {
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('myuni_applications')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: 'Başvuru bulunamadı' };
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    reviewed_by: admin.userId,
    reviewed_by_email: admin.email,
    reviewed_at: new Date().toISOString(),
  };

  if (updates.adminNotes !== undefined) patch.admin_notes = updates.adminNotes;

  const statusChanged =
    updates.status &&
    updates.status !== existing.status &&
    VALID_STATUSES.includes(updates.status);

  if (statusChanged) patch.status = updates.status;

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('myuni_applications')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  if (statusChanged) {
    await supabaseAdmin.from('myuni_application_status_history').insert({
      application_id: id,
      old_status: existing.status,
      new_status: updates.status,
      changed_by: admin.userId,
      changed_by_email: admin.email,
      note: updates.adminNotes || null,
    });

    if (updates.notifyApplicant !== false && existing.applicant_email) {
      const sub = existing.submission_data as Record<string, unknown>;
      try {
        await sendApplicationStatusChangeEmail({
          applicantEmail: existing.applicant_email as string,
          applicantName: applicantNameFromSubmission(sub),
          contextTitle: existing.context_title as LocalizedText,
          newStatus: updates.status as ApplicationStatus,
          adminNote: updates.adminNotes,
        });
      } catch (e) {
        console.error('[applicationService] status email:', e);
      }
    }
  }

  return { success: true, application: updated as ApplicationRecord };
}

export async function getApplicationStatusForContext(
  userId: string,
  contextType: ApplicationContextType,
  contextId: string
): Promise<ApplicationStatus | null> {
  const { data } = await supabaseAdmin
    .from('myuni_applications')
    .select('status')
    .eq('context_type', contextType)
    .eq('context_id', contextId)
    .eq('user_id', userId)
    .maybeSingle();

  return (data?.status as ApplicationStatus) || null;
}

export async function exportApplicationsCsv(filters: {
  contextType?: ApplicationContextType;
  status?: ApplicationStatus;
}) {
  const { applications } = await listApplicationsForAdmin({
    ...filters,
    limit: 5000,
  });

  const headers = [
    'id',
    'context_type',
    'context_slug',
    'context_label',
    'applicant_email',
    'status',
    'created_at',
  ];
  const lines = [headers.join(',')];

  for (const app of applications) {
    lines.push(
      [
        app.id,
        app.context_type,
        app.context_slug || '',
        `"${(app.context_label || '').replace(/"/g, '""')}"`,
        app.applicant_email || '',
        app.status,
        app.created_at,
      ].join(',')
    );
  }

  return lines.join('\n');
}
