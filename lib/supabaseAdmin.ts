import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY so server-only routes can reliably operate
 * behind RLS. Never silently downgrade an administrative client to anon.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL');
}

if (!serviceRoleKey) {
  throw new Error('Missing env: SUPABASE_SERVICE_ROLE_KEY');
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

