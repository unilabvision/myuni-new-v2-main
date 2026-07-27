export type SiteApplicationFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'textarea'
  | 'number'
  | 'date'
  | 'time'
  | 'url'
  | 'select'
  | 'checkbox'
  | 'dropdown'
  | 'linear_scale'
  | 'rating'
  | 'file'
  | 'resource';

export interface SiteApplicationFormFieldOption {
  value: string;
  label_tr: string;
  label_en: string;
}

export interface SiteApplicationFormField {
  id: string;
  form_id: string;
  field_key: string;
  field_type: SiteApplicationFieldType;
  label_tr: string;
  label_en: string;
  placeholder_tr: string | null;
  placeholder_en: string | null;
  required: boolean;
  order_index: number;
  options: SiteApplicationFormFieldOption[];
  is_contact: boolean;
  created_at: string;
}

export interface SiteApplicationForm {
  id: string;
  slug_tr: string;
  slug_en: string;
  title_tr: string;
  title_en: string;
  subtitle_tr: string | null;
  subtitle_en: string | null;
  success_message_tr: string | null;
  success_message_en: string | null;
  is_active: boolean;
  show_on_website: boolean;
  allows_attachment: boolean;
  form_type?: 'team' | 'event' | null;
  event_id: string | null;
  package_settings?: unknown;
  created_by: string | null;
  created_by_email: string | null;
  created_at: string;
  updated_at: string;
  fields?: SiteApplicationFormField[];
}

export interface PublicRegistrationPackage {
  tier: 'free' | 'certificate';
  title: string;
  description: string;
  price: number;
  requiresPayment: boolean;
}

export interface PublicSiteApplicationForm {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  success_message: string | null;
  allows_attachment: boolean;
  form_type?: 'team' | 'event' | null;
  event_id?: string | null;
  event_slug?: string | null;
  event_title?: string | null;
  packages?: PublicRegistrationPackage[];
  fields: Array<{
    field_key: string;
    field_type: SiteApplicationFieldType;
    label: string;
    placeholder: string | null;
    required: boolean;
    order_index: number;
    options: Array<{ value: string; label: string }>;
    /** Present when field_type is resource and admin uploaded a file */
    resource_file_name?: string | null;
    has_resource?: boolean;
  }>;
}

export interface PublicSiteApplicationNavForm {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  url: string;
  navSection: 'events' | 'about';
  eventSlug?: string | null;
  eventTitle?: string | null;
}
