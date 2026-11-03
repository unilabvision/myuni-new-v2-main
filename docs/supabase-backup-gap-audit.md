# Supabase backup gap audit

Audit date: 2026-11-03

Source backup: `/Users/mac/Desktop/Supabase-Full-Backup`

## Completed checks

- The PostgreSQL custom dump is readable (`pg_dump` 17.11, source PostgreSQL 15.8).
- The backup contains 115 `public` tables.
- The existing DB1/DB2/DB3 transfer lists contain 75 tables.
- All 75 transferred tables match the backup row counts.
- All 75 transferred tables match the backup column sets.
- The only live-only column initially reported by a simple parser,
  `internship_applications.position`, is present in the backup as a quoted column.
- Storage objects are handled separately from this database audit.

## Gap summary

Forty backup tables were omitted from all three transfer lists. The proposed
placement below keeps internal foreign keys in one database and separates
identity/access, learning, and forms data.

### DB1 / Identity and access

| Table | Backup rows | Reason |
| --- | ---: | --- |
| `certificate_issuance_queue` | 196 | Certificate issuance state belongs with certificates and orders. |
| `modules` | 17 | Module catalog used by Uniboard access control. |
| `org_smtp_configs` | 2 | Organization-level sensitive configuration. |
| `panel_organizations` | 4 | Parent data for panel access. |
| `user_module_access` | 53 | References `modules`, `panel_organizations`, and DB1 `organizations`. |

### DB2 / Learning and events

| Table group | Tables | Backup rows |
| --- | --- | ---: |
| Analytics | `myuni_analytics` | 0 |
| Documents | `myuni_documents` | 5 |
| MyUNI Edge | `myuni_edge`, `myuni_edge_content`, `myuni_edge_data`, `myuni_edge_progress`, `myuni_edge_sections` | 60 |
| Corporate LMS | `myuni_kurum_course_lessons_user`, `myuni_kurum_courses`, `myuni_kurum_enrollments`, `myuni_kurum_home`, `myuni_kurum_lessons_data`, `myuni_kurum_personalized_education`, `myuni_kurum_personalized_education_user`, `myuni_kurum_user_notes`, `myuni_kurum_user_progress` | 280 |
| Session state | `myuni_session_attendance`, `myuni_user_notes` | 0 |
| Archive | `myuni_videos_backup` | 22 |
| UNICOM | `unicom_event_control`, `unicom_event_enrollments`, `unicom_event_enrollments_attendance`, `unicom_event_sessions`, `unicom_event_sessions_attendance`, `unicom_events`, `unicom_home`, `unicom_sponsors`, `unicom_topics`, `unicom_topics_meta`, `unicom_user_data` | 2,637 |

All foreign keys inside the Edge, corporate LMS, and UNICOM groups remain
internal when these groups are placed in DB2.

### DB3 / Forms and applications

| Table | Backup rows | Reason |
| --- | ---: | --- |
| `myuni_contacts` | 5 | Contact/form data. |
| `myuni_opportunity_applications` | 0 | Applicant data; its reference to DB2 opportunities must become application-level validation. |
| `myuni_opportunity_application_status_history` | 0 | Child of opportunity applications. |
| `partners` | 5 | Public site content. |
| `unilab_vision_votes` | 256 | References DB3 `unilab_vision_apply`. |

## Code/schema issues that are not backup omissions

- `user_profiles` is referenced by the profile completion API but does not
  exist in the backup or any live database. It needs a new DB1 migration.
- `blog_comments` is referenced by an unused blog comment component/API but
  does not exist in the backup. It must either be removed or introduced as a
  new DB3 table if blog comments are enabled.
- `myuni_sections` is an obsolete table name in `lib/courseService.ts`; the
  live schema uses `myuni_course_sections` and `myuni_course_lessons`.
- `form_configs` and `form_submissions` are legacy names. The backup contains
  `unilab_vision_form_configs`, `unilab_vision_apply`, and
  `myuni_form_submissions`; the compatibility branch should be removed or
  corrected instead of creating duplicate legacy tables.
- `features_content`, `projects_content`, and `stats_content` are referenced
  by components that are not mounted by any current page. They are not present
  in the backup and should not be recreated without a product decision.

## Migration safety requirements

1. Never restore `auth`, `storage`, `vault`, `realtime`, or Supabase-owned
   schemas into the three managed projects.
2. Create only the selected `public` tables, sequences, indexes, triggers, and
   policies.
3. Do not preserve cross-database foreign keys. In particular,
   `myuni_opportunity_applications.opportunity_id` points to a DB2 table and
   must be validated by application code.
4. Import parent tables before child tables.
5. Keep `org_smtp_configs.smtp_password_encrypted` confidential and restrict
   it to server-side access.
6. Verify row counts, primary keys, unique constraints, RLS, and representative
   reads after each target migration.
7. Do not commit generated data SQL or CSV files to Git.

## Current status

- Storage upload: complete.
- Backup inventory: complete.
- Existing 75-table verification: complete, no differences.
- Missing 40-table classification: complete.
- Missing-table restore: complete on 2026-11-03.
  - DB1 / Identity: 5 tables, 270 rows, all row counts matched.
  - DB2 / Learning: 30 tables, 3,004 rows, all row counts matched;
    6 required trigger functions and 12 triggers verified.
  - DB3 / Forms: 5 tables, 266 rows, all row counts matched.
  - The cross-database foreign key from
    `myuni_opportunity_applications.opportunity_id` to DB2 was intentionally
    omitted; the two DB3-internal foreign keys were verified.
  - Every restore ran in a single transaction with `ON_ERROR_STOP=1`.
- Storage URL rewrite: complete on 2026-11-03.
  - 837 rows and 911 verified Storage references were rewritten across the
    three targets.
  - A full primary-key-ordered pagination pass ended with zero rewritable
    references on all three targets.
  - Eighteen references were intentionally preserved because their physical
    source objects are absent from the local backup: 1 product image, 14
    course banner/thumbnail images, and 3 private application attachments.
  - Historical/audit snapshot tables were intentionally excluded.
- Post-restore application compatibility:
  - Added a central table/RPC router for the three Supabase projects.
  - Replaced cross-database embedded course joins with explicit queries.
  - Created the missing, server-only `user_profiles` table in DB1 with RLS.
  - Added curated public-content policies; payment, progress, private video,
    application, and profile tables remain unavailable to anon clients.
  - Production build generates 73 sitemap URLs (26 static, 36 course, 4
    package, 7 blog).
