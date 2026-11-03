import 'server-only';
import { getIdentityAdminClient } from './supabase/adminDatabases';

/**
 * Server-side Supabase client.
 *
 * Uses the IDENTITY secret key so server-only routes can reliably operate
 * behind RLS. Legacy primary/service-role variables remain a migration fallback.
 */
export const supabaseAdmin = getIdentityAdminClient();

