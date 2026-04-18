import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ purchasedIds: [] });
  }

  const { data, error } = await supabaseAdmin
    .from('myuni_products_purchases')
    .select('product_id')
    .eq('user_id', userId);

  if (error) {
    console.error('My purchases fetch error:', error);
    return NextResponse.json({ purchasedIds: [] });
  }

  const purchasedIds = (data || []).map((row: { product_id: string }) => row.product_id);
  return NextResponse.json({ purchasedIds });
}
