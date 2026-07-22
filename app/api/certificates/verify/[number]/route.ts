import { NextRequest, NextResponse } from 'next/server';
import {
  getCertificateByNumber,
  getMyUNICertificateByNumber,
  getMyUNIEventCertificateByNumber,
} from '@/lib/certificateService';

/**
 * GET /api/certificates/verify/[number] — public verify lookup
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ number: string }> }
) {
  try {
    const { number } = await context.params;
    const certificateNumber = decodeURIComponent(number || '').trim();
    if (!certificateNumber) {
      return NextResponse.json({ success: false, error: 'Certificate number required' }, { status: 400 });
    }

    let data =
      (await getCertificateByNumber(certificateNumber).catch(() => null)) ||
      (await getMyUNICertificateByNumber(certificateNumber).catch(() => null)) ||
      (await getMyUNIEventCertificateByNumber(certificateNumber).catch(() => null));

    if (!data) {
      return NextResponse.json({ success: false, error: 'Certificate not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/certificates/verify error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
