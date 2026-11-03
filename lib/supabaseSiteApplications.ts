import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getFormsAdminClient } from './supabase/adminDatabases';

/**
 * Site başvuru formları ayrı forms projesinde tutulur.
 * Checkout ve başvuru akışlarının identity projesine düşmemesi için
 * merkezi multi-database yapılandırmasını kullan.
 */
export function getSiteApplicationsSupabase(): SupabaseClient {
  return getFormsAdminClient();
}
