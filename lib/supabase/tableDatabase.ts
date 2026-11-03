import type { SupabaseDatabase } from './databases';

const identityTables = new Set([
  'campaigns', 'discount_codes', 'orders', 'myuni_products', 'myuni_products_purchases',
  'myuni_enrollments', 'myuni_package_enrollments', 'myuni_membership_plans',
  'myuni_membership_plan_benefits', 'myuni_membership_passes',
  'myuni_membership_entitlements', 'myuni_membership_audit_log', 'organizations',
  'certificate_templates', 'certificates', 'myuni_certificates',
  'myuni_event_certificates', 'myuni_certificate_exceptions',
  'certificate_issuance_queue', 'modules', 'org_smtp_configs', 'panel_organizations',
  'user_module_access', 'user_profiles',
]);

const learningTables = new Set([
  'myuni_courses', 'myuni_course_sections', 'myuni_course_lessons',
  'myuni_course_objectives', 'myuni_course_requirements', 'myuni_course_tiers',
  'myuni_course_career_tags', 'myuni_videos', 'myuni_notes', 'myuni_quicks',
  'myuni_user_progress', 'myuni_comments', 'myuni_packages', 'myuni_package_courses',
  'myuni_live_sessions', 'myuni_live_registrations', 'myuni_tier_sessions',
  'myuni_events', 'myuni_event_sections', 'myuni_event_lessons', 'myuni_event_videos',
  'myuni_event_notes', 'myuni_event_enrollments', 'myuni_event_user_progress',
  'myuni_event_comments', 'myuni_event_competitions',
  'myuni_event_competition_results', 'myuni_opportunities', 'myuni_career_tags',
  'myuni_opportunity_career_tags', 'myuni_opportunity_courses', 'myuni_case_result',
  'myuni_analytics', 'myuni_documents', 'myuni_edge', 'myuni_edge_content',
  'myuni_edge_data', 'myuni_edge_progress', 'myuni_edge_sections',
  'myuni_kurum_course_lessons_user', 'myuni_kurum_courses', 'myuni_kurum_enrollments',
  'myuni_kurum_home', 'myuni_kurum_lessons_data',
  'myuni_kurum_personalized_education', 'myuni_kurum_personalized_education_user',
  'myuni_kurum_user_notes', 'myuni_kurum_user_progress', 'myuni_session_attendance',
  'myuni_user_notes', 'myuni_videos_backup', 'unicom_event_control',
  'unicom_event_enrollments', 'unicom_event_enrollments_attendance',
  'unicom_event_sessions', 'unicom_event_sessions_attendance', 'unicom_events',
  'unicom_home', 'unicom_sponsors', 'unicom_topics', 'unicom_topics_meta',
  'unicom_user_data',
]);

const formsTables = new Set([
  'myuni_applications', 'myuni_application_status_history',
  'myuni_site_application_forms', 'myuni_site_application_form_fields',
  'myuni_site_applications', 'myuni_site_application_status_history',
  'internship_applications', 'internship_form_configs', 'internship_form_fields',
  'internship_reviewers', 'internship_status_history', 'internship_votes',
  'mentorships', 'mentorship_applications', 'mentorship_application_status_history',
  'myuni_form_submissions', 'unilab_vision_apply', 'unilab_vision_form_configs',
  'unilab_vision_form_fields', 'unilab_vision_contact_submissions',
  'unilab_vision_newsletter_subscriptions', 'unilab_vision_blog_posts',
  'unilab_vision_blog_categories', 'unilab_vision_blog_post_tags',
  'unilab_vision_forms_management', 'myuni_contacts',
  'myuni_opportunity_applications', 'myuni_opportunity_application_status_history',
  'partners', 'unilab_vision_votes', 'blog_comments', 'form_configs',
  'form_submissions',
]);

const rpcDatabases: Record<string, SupabaseDatabase> = {
  get_public_campaign: 'identity',
  myuni_membership_deliver_pass: 'identity',
  get_course_rating_summary: 'learning',
  match_case_result_with_user: 'learning',
};

export function databaseForTable(table: string): SupabaseDatabase {
  if (learningTables.has(table)) return 'learning';
  if (formsTables.has(table)) return 'forms';
  if (identityTables.has(table)) return 'identity';
  return 'identity';
}

export function databaseForRpc(fn: string): SupabaseDatabase {
  return rpcDatabases[fn] ?? 'identity';
}
