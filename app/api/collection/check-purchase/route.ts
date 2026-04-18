import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Service role client - RLS'yi bypass eder
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ hasPurchased: false });
  }

  const productId = req.nextUrl.searchParams.get('product_id');
  if (!productId) {
    return NextResponse.json({ hasPurchased: false });
  }

  const { data, error } = await supabaseAdmin
    .from('myuni_products_purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  if (error) {
    console.error('Purchase check error:', error);
    return NextResponse.json({ hasPurchased: false });
  }

  return NextResponse.json({ hasPurchased: !!data });
}
