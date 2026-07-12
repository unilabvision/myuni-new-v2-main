import { NextResponse } from 'next/server';

/** Shopier ödemeleri kaldırıldı — yalnızca Iyzico kullanılır. */
const gone = () =>
  NextResponse.json(
    {
      success: false,
      message:
        'Shopier payment is disabled. Use Iyzico checkout at /checkout.',
      code: 'SHOPIER_DISABLED',
    },
    { status: 410 }
  );

export async function GET() {
  return gone();
}

export async function POST() {
  return gone();
}
