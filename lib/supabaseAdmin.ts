import 'server-only';
import { getAdminSupabaseClient } from './supabase/adminDatabases';
import { createRoutedSupabaseClient } from './supabase/routedClient';

/**
 * Server-side compatibility client that routes table and RPC calls to the
 * Identity, Learning, or Forms project. Explicit storage clients are used by
 * routes whose bucket name exists in more than one project.
 */
export const supabaseAdmin = createRoutedSupabaseClient(getAdminSupabaseClient);

