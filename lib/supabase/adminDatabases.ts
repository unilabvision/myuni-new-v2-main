import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseDatabase } from './databases';

type AdminDatabaseConfig = {
  url?: string;
  secretKey?: string;
};

const fallbackSecretKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminConfigs: Record<SupabaseDatabase, AdminDatabaseConfig> = {
  identity: {
    url:
      process.env.NEXT_PUBLIC_SUPABASE_IDENTITY_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    secretKey: process.env.SUPABASE_IDENTITY_SECRET_KEY ?? fallbackSecretKey,
  },
  learning: {
    url:
      process.env.NEXT_PUBLIC_SUPABASE_LEARNING_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    secretKey: process.env.SUPABASE_LEARNING_SECRET_KEY ?? fallbackSecretKey,
  },
  forms: {
    url:
      process.env.NEXT_PUBLIC_SUPABASE_FORMS_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    secretKey: process.env.SUPABASE_FORMS_SECRET_KEY ?? fallbackSecretKey,
  },
};

const adminClients: Partial<Record<SupabaseDatabase, SupabaseClient>> = {};

export function getAdminSupabaseClient(database: SupabaseDatabase): SupabaseClient {
  const existingClient = adminClients[database];
  if (existingClient) return existingClient;

  const { url, secretKey } = adminConfigs[database];
  if (!url || !secretKey) {
    throw new Error(`Missing admin Supabase configuration for ${database} database`);
  }

  const client = createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  adminClients[database] = client;
  return client;
}

export const getIdentityAdminClient = () => getAdminSupabaseClient('identity');
export const getLearningAdminClient = () => getAdminSupabaseClient('learning');
export const getFormsAdminClient = () => getAdminSupabaseClient('forms');
