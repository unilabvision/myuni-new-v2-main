export type OpportunityWorkMode = 'remote' | 'hybrid' | 'onsite';
export type OpportunityApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'accepted'
  | 'rejected';

export interface LocalizedText {
  tr?: string;
  en?: string;
  [key: string]: string | undefined;
}

export interface CareerTag {
  id: string;
  slug: string;
  name: LocalizedText;
}

export interface Opportunity {
  id: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText | null;
  company_name: string | null;
  location: string | null;
  work_mode: OpportunityWorkMode | null;
  application_deadline: string | null;
  form_config_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
  tags?: CareerTag[];
  course_ids?: string[];
}

export interface OpportunityWithMatch extends Opportunity {
  display_title?: string;
  display_description?: string;
  is_recommended: boolean;
  can_apply: boolean;
  match_reasons: string[];
  matching_course_ids: string[];
  user_application_status?: OpportunityApplicationStatus | null;
}

export interface OpportunityApplication {
  id: string;
  opportunity_id: string;
  user_id: string;
  applicant_email: string | null;
  submission_data: Record<string, unknown>;
  cv_storage_path: string | null;
  cv_file_name: string | null;
  status: OpportunityApplicationStatus;
  admin_notes?: string | null;
  reviewed_by?: string | null;
  reviewed_by_email?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  opportunity?: Opportunity;
}

export interface UserCourseCompletion {
  course_id: string;
  course_title: string;
  tag_ids: string[];
}
