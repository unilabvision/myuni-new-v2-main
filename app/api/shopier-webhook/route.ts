import { NextResponse } from 'next/server';

/** Shopier webhook/OSB kapatıldı — ödemeler yalnızca Iyzico üzerinden. */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      message: 'Shopier webhook disabled. Use Iyzico only.',
      code: 'SHOPIER_DISABLED',
    },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: 'Shopier webhook disabled. Payments use Iyzico only.',
      code: 'SHOPIER_DISABLED',
    },
    { status: 410 }
  );
}
