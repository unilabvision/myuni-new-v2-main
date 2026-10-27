import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { getVerifiedProductAccessEmails } from '../../../../lib/productAccess';
import { getMembershipEntitlementAccess } from '@/lib/membershipAccess';

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ hasPurchased: false });
  }

  const productId = req.nextUrl.searchParams.get('product_id');
  if (!productId) {
    return NextResponse.json({ hasPurchased: false });
  }

  let { data, error } = await supabaseAdmin
    .from('myuni_products_purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  if (!error && !data) {
    const verifiedEmails = await getVerifiedProductAccessEmails();
    if (verifiedEmails.length) {
      const emailResult = await supabaseAdmin
        .from('myuni_products_purchases')
        .select('id')
        .in('user_id', verifiedEmails)
        .eq('product_id', productId)
        .limit(1)
        .maybeSingle();
      data = emailResult.data;
      error = emailResult.error;
    }
  }

  if (error) {
    console.error('Purchase check error:', error);
    return NextResponse.json({ hasPurchased: false });
  }

  if (!data) {
    const membershipAccess = await getMembershipEntitlementAccess({
      userId,
      resourceType: 'product',
      resourceId: productId,
    });
    if (membershipAccess.hasAccess) {
      return NextResponse.json({ hasPurchased: true, accessSource: 'membership', endsAt: membershipAccess.endsAt });
    }
  }

  return NextResponse.json({ hasPurchased: !!data });
}
