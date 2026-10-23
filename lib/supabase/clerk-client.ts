import 'server-only';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    );
  }

  return { url, key };
}

/**
 * Creates a server-side Supabase client authenticated with the current Clerk user.
 * Supabase RLS can use the Clerk subject claim through auth.uid().
 */
export function createClerkSupabaseClient() {
  const { url, key } = getSupabaseConfig();

  return createClient(url, key, {
    accessToken: async () => {
      const { getToken } = await auth();
      return getToken();
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
