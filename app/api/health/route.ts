import { NextResponse } from 'next/server';
import {
  getFormsAdminClient,
  getIdentityAdminClient,
  getLearningAdminClient,
} from '@/lib/supabase/adminDatabases';

export const dynamic = 'force-dynamic';

type CheckResult = {
  ok: boolean;
  latencyMs: number;
  error?: string;
};

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs = 5000): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), timeoutMs),
    ),
  ]);
}

async function databaseCheck(
  query: PromiseLike<{ error: { message?: string } | null }>,
): Promise<CheckResult> {
  const startedAt = Date.now();
  try {
    const result = await withTimeout(query);
    if (result.error) throw new Error(result.error.message || 'query failed');
    return { ok: true, latencyMs: Date.now() - startedAt };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : 'unknown error',
    };
  }
}

export async function GET() {
  const [identity, learning, forms] = await Promise.all([
    databaseCheck(getIdentityAdminClient().from('myuni_products').select('id').limit(1)),
    databaseCheck(getLearningAdminClient().from('myuni_courses').select('id').limit(1)),
    databaseCheck(
      getFormsAdminClient().from('myuni_site_application_forms').select('id').limit(1),
    ),
  ]);

  const paymentConfigured = Boolean(
    process.env.IYZICO_API_KEY && process.env.IYZICO_SECRET_KEY && process.env.IYZICO_BASE_URL,
  );
  const checks = {
    databases: { identity, learning, forms },
    payment: { ok: paymentConfigured },
  };
  const ok = identity.ok && learning.ok && forms.ok && paymentConfigured;

  return NextResponse.json(
    {
      ok,
      status: ok ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    },
    {
      status: ok ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
