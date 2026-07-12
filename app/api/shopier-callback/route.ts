import { NextResponse } from 'next/server';

/** Shopier ödemeleri kaldırıldı — yalnızca Iyzico kullanılır. */
const gone = () =>
  NextResponse.json(
    {
      success: false,
      message: 'Shopier callback is disabled. Payments use Iyzico only.',
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
