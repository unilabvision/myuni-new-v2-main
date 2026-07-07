export type ApplicationContextType =
  | 'opportunity'
  | 'event'
  | 'club'
  | 'campaign'
  | 'generic';

export type ApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'cancelled';

export interface LocalizedText {
  tr?: string;
  en?: string;
  [key: string]: string | undefined;
}

export interface ApplicationRecord {
  id: string;
  context_type: ApplicationContextType;
  context_id: string;
  context_slug: string | null;
  context_title: LocalizedText | null;
  form_config_id: string | null;
  user_id: string;
  applicant_email: string | null;
  submission_data: Record<string, unknown>;
  cv_storage_path: string | null;
  cv_file_name: string | null;
  status: ApplicationStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_by_email: string | null;
  reviewed_at: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
  /** Joined metadata for admin display */
  context_label?: string;
  opportunity?: {
    id: string;
    slug: string;
    title?: LocalizedText;
    company_name?: string | null;
  };
}

export const CONTEXT_TYPE_LABELS: Record<
  ApplicationContextType,
  { tr: string; en: string }
> = {
  opportunity: { tr: 'Staj & Kariyer', en: 'Internship & Career' },
  event: { tr: 'Etkinlik', en: 'Event' },
  club: { tr: 'Kulüp', en: 'Club' },
  campaign: { tr: 'Kampanya', en: 'Campaign' },
  generic: { tr: 'Genel Başvuru', en: 'General Application' },
};

export const APPLICATION_STATUS_LABELS: Record<
  ApplicationStatus,
  { tr: string; en: string }
> = {
  pending: { tr: 'Beklemede', en: 'Pending' },
  under_review: { tr: 'Değerlendiriliyor', en: 'Under review' },
  accepted: { tr: 'Kabul', en: 'Accepted' },
  rejected: { tr: 'Red', en: 'Rejected' },
  cancelled: { tr: 'İptal', en: 'Cancelled' },
};
