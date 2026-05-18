import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, purchases: [] }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('myuni_products_purchases')
      .select('*, product:myuni_products(id, title, slug, thumbnail_url, product_type, price)')
      .eq('user_id', userId)
      .order('purchased_at', { ascending: false });

    if (error) {
      console.error('Detailed purchases fetch error:', error);
      return NextResponse.json({ success: false, purchases: [] }, { status: 500 });
    }

    return NextResponse.json({ success: true, purchases: data || [] });
  } catch (err) {
    console.error('my-purchased-products route error:', err);
    return NextResponse.json({ success: false, purchases: [] }, { status: 500 });
  }
}
