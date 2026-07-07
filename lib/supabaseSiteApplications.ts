import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Site başvuru formları LMS veritabanında (URL2) tutulur.
 * URL2 yoksa birincil Supabase'e düşer.
 */
export function getSiteApplicationsSupabase(): SupabaseClient {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL2 || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY2 || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Site applications Supabase config missing (URL2/SERVICE_ROLE_KEY2 or primary URL/KEY)'
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
