import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type SupabaseDatabase = 'identity' | 'learning' | 'forms';

type PublicDatabaseConfig = {
  url?: string;
  publishableKey?: string;
};

const publicConfigs: Record<SupabaseDatabase, PublicDatabaseConfig> = {
  identity: {
    url:
      process.env.NEXT_PUBLIC_SUPABASE_IDENTITY_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_IDENTITY_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  learning: {
    url:
      process.env.NEXT_PUBLIC_SUPABASE_LEARNING_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_LEARNING_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  forms: {
    url:
      process.env.NEXT_PUBLIC_SUPABASE_FORMS_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_FORMS_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

const publicClients: Partial<Record<SupabaseDatabase, SupabaseClient>> = {};

export function getPublicSupabaseClient(database: SupabaseDatabase): SupabaseClient {
  const existingClient = publicClients[database];
  if (existingClient) return existingClient;

  const { url, publishableKey } = publicConfigs[database];
  if (!url || !publishableKey) {
    throw new Error(`Missing public Supabase configuration for ${database} database`);
  }

  const client = createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  publicClients[database] = client;
  return client;
}

export const getIdentitySupabaseClient = () => getPublicSupabaseClient('identity');
export const getLearningSupabaseClient = () => getPublicSupabaseClient('learning');
export const getFormsSupabaseClient = () => getPublicSupabaseClient('forms');
