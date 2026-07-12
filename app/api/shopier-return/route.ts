import { NextResponse } from 'next/server';

/** Shopier ödemeleri kaldırıldı — yalnızca Iyzico kullanılır. */
function redirectHome(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'tr';
  return NextResponse.redirect(new URL(`/${locale}/payment-failed?error=shopier_disabled`, url.origin));
}

export async function GET(request: Request) {
  return redirectHome(request);
}

export async function POST(request: Request) {
  return redirectHome(request);
}
