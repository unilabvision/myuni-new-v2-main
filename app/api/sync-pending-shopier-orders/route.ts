import { NextResponse } from 'next/server';

/** Shopier bekleyen sipariş sync kapatıldı — ödemeler yalnızca Iyzico. */
export async function POST() {
  return NextResponse.json(
    {
      success: true,
      synced: 0,
      message: 'Shopier sync disabled. Payments use Iyzico only.',
      code: 'SHOPIER_DISABLED',
    },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: 'Shopier sync disabled.',
      code: 'SHOPIER_DISABLED',
    },
    { status: 410 }
  );
}
