import process from 'node:process';

const BASE_URL = (process.env.HEALTHCHECK_BASE_URL || 'https://www.myunilab.net').replace(/\/$/, '');
const TIMEOUT_MS = Number(process.env.HEALTHCHECK_TIMEOUT_MS || 15_000);
const SKIP_PAYMENT = process.argv.includes('--skip-payment');

const RESTORED_COURSE_IDS = new Set([
  'bbd8d0df-f07f-4adf-82f2-b4700324cffe',
  'dc75a7ce-7f1b-42f5-95a7-8e421c484d92',
  '37af131a-b606-483e-8926-0df5e79f5b89',
]);

const results = [];

function record(ok, name, detail = '') {
  results.push({ ok, name, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` - ${detail}` : ''}`);
}

async function request(pathname, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const startedAt = Date.now();
  try {
    const response = await fetch(`${BASE_URL}${pathname}`, {
      cache: 'no-store',
      redirect: 'follow',
      ...init,
      headers: {
        'user-agent': 'MyUniLab-Production-Healthcheck/1.0',
        ...init.headers,
      },
      signal: controller.signal,
    });
    return { response, latencyMs: Date.now() - startedAt };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkStatus(name, pathname, expectedStatus, init) {
  try {
    const { response, latencyMs } = await request(pathname, init);
    const ok = response.status === expectedStatus;
    record(ok, name, `HTTP ${response.status}, ${latencyMs} ms`);
    await response.body?.cancel();
  } catch (error) {
    record(false, name, error instanceof Error ? error.message : String(error));
  }
}

async function checkCoreHealth() {
  try {
    const { response, latencyMs } = await request('/api/health');
    const body = await response.json();
    const databaseChecks = body?.checks?.databases || {};
    const databasesOk = ['identity', 'learning', 'forms'].every(
      (database) => databaseChecks[database]?.ok === true,
    );
    const ok = response.status === 200 && body?.ok === true && databasesOk && body?.checks?.payment?.ok === true;
    record(ok, 'Core API / database / payment configuration', `HTTP ${response.status}, ${latencyMs} ms`);
  } catch (error) {
    record(false, 'Core API / database / payment configuration', error instanceof Error ? error.message : String(error));
  }
}

async function checkCatalogAndImages() {
  try {
    const { response, latencyMs } = await request('/api/public/courses?locale=tr');
    const body = await response.json();
    const courses = Array.isArray(body?.courses) ? body.courses : [];
    record(response.ok && courses.length > 0, 'Public course catalog', `HTTP ${response.status}, ${courses.length} courses, ${latencyMs} ms`);

    for (const courseId of RESTORED_COURSE_IDS) {
      const course = courses.find((item) => String(item.id) === courseId);
      const urls = [course?.thumbnail_url, course?.banner_url].filter(Boolean);
      const restored = urls.length === 2 && urls.every((url) => url.includes('/courses/restored/'));
      record(restored, `Restored course media ${course?.title || courseId}`, restored ? 'restored URL active' : 'fallback or missing URL');
    }

    const imageUrls = [...new Set(courses.flatMap((course) => [course.thumbnail_url, course.banner_url]).filter(Boolean))];
    const imageResults = await Promise.all(
      imageUrls.map(async (url) => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
          try {
            const imageResponse = await fetch(url, {
              cache: 'no-store',
              headers: { range: 'bytes=0-1023', 'user-agent': 'MyUniLab-Production-Healthcheck/1.0' },
              signal: controller.signal,
            });
            const contentType = imageResponse.headers.get('content-type') || '';
            await imageResponse.body?.cancel();
            return imageResponse.ok && contentType.startsWith('image/');
          } finally {
            clearTimeout(timeout);
          }
        } catch {
          return false;
        }
      }),
    );
    const healthyImages = imageResults.filter(Boolean).length;
    record(healthyImages === imageUrls.length, 'Course image delivery', `${healthyImages}/${imageUrls.length} reachable`);
  } catch (error) {
    record(false, 'Public course catalog and images', error instanceof Error ? error.message : String(error));
  }
}

async function checkPaymentBoundaries() {
  if (SKIP_PAYMENT) {
    console.log('SKIP  Payment boundary smoke tests (--skip-payment)');
    return;
  }

  await checkStatus('Payment rejects missing legal consent', '/api/iyzico-payment', 400, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  await checkStatus('Payment rejects missing customer fields', '/api/iyzico-payment', 400, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ privacyAccepted: true, termsAccepted: true, locale: 'tr' }),
  });
  await checkStatus('Payment requires an authenticated session', '/api/iyzico-payment', 401, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: 'smoke-test@example.invalid',
      name: 'Production Smoke Test',
      privacyAccepted: true,
      termsAccepted: true,
      locale: 'tr',
    }),
  });
  await checkStatus('Reconciliation rejects missing order ID', '/api/iyzico-reconcile', 400, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  await checkStatus('Reconciliation requires authentication', '/api/iyzico-reconcile', 401);
  await checkStatus('Order lookup rejects missing order ID', '/api/order-by-id', 400);
}

console.log(`MyUniLab production healthcheck: ${BASE_URL}`);
await checkCoreHealth();
await Promise.all([
  checkStatus('Turkish homepage', '/tr', 200),
  checkStatus('Course page', '/tr/kurs', 200),
  checkStatus('Event page', '/tr/etkinlik', 200),
  checkStatus('Public events API', '/api/events?locale=tr', 200),
]);
await checkCatalogAndImages();
await Promise.all([
  checkStatus('Course enrollment auth boundary', '/api/enrollments/me', 401),
  checkStatus('Event enrollment auth boundary', '/api/event-enrollments/me', 401),
  checkStatus('Order history auth boundary', '/api/orders/me', 401),
  checkStatus('Certificate auth boundary', '/api/certificates/me', 401),
]);
await checkPaymentBoundaries();

const failed = results.filter((result) => !result.ok);
console.log(`\nSummary: ${results.length - failed.length}/${results.length} passed`);
if (failed.length > 0) {
  console.error(`Failed checks: ${failed.map((result) => result.name).join(', ')}`);
  process.exitCode = 1;
}
