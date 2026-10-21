import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { getVerifiedProductAccessEmails } from '../../../../lib/productAccess';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ purchasedIds: [] });
  }

  let { data, error } = await supabaseAdmin
    .from('myuni_products_purchases')
    .select('product_id')
    .eq('user_id', userId);

  if (!error && !data?.length) {
    const verifiedEmails = await getVerifiedProductAccessEmails();
    if (verifiedEmails.length) {
      const emailResult = await supabaseAdmin
        .from('myuni_products_purchases')
        .select('product_id')
        .in('user_id', verifiedEmails);
      data = emailResult.data;
      error = emailResult.error;
    }
  }

  if (error) {
    console.error('My purchases fetch error:', error);
    return NextResponse.json({ purchasedIds: [] });
  }

  const purchasedIds = (data || []).map((row: { product_id: string }) => row.product_id);
  return NextResponse.json({ purchasedIds });
}
