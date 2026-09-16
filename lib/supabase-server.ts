// lib/supabase-server.ts - Server-side Supabase client for API routes
//
// Admin (service-role) erişimi için doğrudan `supabaseAdmin` singleton'ı kullanın.
// Bu dosya yalnızca anon-key public client'ı sağlamak için bırakılmıştır.
// createServerSupabaseClient() kaldırıldı — yerine `supabaseAdmin` kullanın:
//   import { supabaseAdmin } from '@/lib/supabaseAdmin';
import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Re-export: mevcut import'ları kırmamak için
export { supabaseAdmin as createServerSupabaseClient } from './supabaseAdmin';

// Public client for server-side (uses anon key)
export function createServerSupabasePublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
    });
    throw new Error('Missing Supabase environment variables for public client');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
