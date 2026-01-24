import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client.
 *
 * Prefer SUPABASE_SERVICE_ROLE_KEY so server routes can update tables even with RLS enabled.
 * Falls back to anon key in development if service key is not provided.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL');
}

if (!serviceRoleKey) {
  // Don't hard-crash in dev, but this is required for reliable server-side writes under RLS.
  // eslint-disable-next-line no-console
  console.warn(
    '[supabaseAdmin] SUPABASE_SERVICE_ROLE_KEY missing. Falling back to anon key; server-side writes may fail under RLS.'
  );
}

if (!serviceRoleKey && !anonKey) {
  throw new Error('Missing env: SUPABASE_SERVICE_ROLE_KEY (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY (fallback)');
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey ?? anonKey!, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

