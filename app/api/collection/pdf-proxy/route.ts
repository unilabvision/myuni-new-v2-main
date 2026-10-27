import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { getVerifiedProductAccessEmails } from '../../../../lib/productAccess';
import { getMembershipEntitlementAccess } from '@/lib/membershipAccess';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  const productId = req.nextUrl.searchParams.get('product_id');

  if (!productId) {
    return new NextResponse('Product ID is missing', { status: 400 });
  }

  // 1. Ürün bilgilerini al
  const { data: product, error: productError } = await supabaseAdmin
    .from('myuni_products')
    .select('id, is_free, product_content')
    .eq('id', productId)
    .single();

  if (productError || !product || !product.product_content) {
    return new NextResponse('Product not found or content missing', { status: 404 });
  }

  // 2. Yetki kontrolü (Ücretsiz değilse satın alım kontrolü yap)
  let isAuthorized = product.is_free;

  if (!isAuthorized) {
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    let { data: purchase, error: purchaseError } = await supabaseAdmin
      .from('myuni_products_purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (!purchaseError && !purchase) {
      const verifiedEmails = await getVerifiedProductAccessEmails();
      if (verifiedEmails.length) {
        const emailResult = await supabaseAdmin
          .from('myuni_products_purchases')
          .select('id')
          .in('user_id', verifiedEmails)
          .eq('product_id', productId)
          .limit(1)
          .maybeSingle();
        purchase = emailResult.data;
        purchaseError = emailResult.error;
      }
    }

    if (purchaseError) {
      console.error('PDF purchase check error:', purchaseError);
      return new NextResponse('Unable to verify access', { status: 500 });
    }

    if (purchase) {
      isAuthorized = true;
    } else {
      const membershipAccess = await getMembershipEntitlementAccess({
        userId,
        resourceType: 'product',
        resourceId: productId,
      });
      isAuthorized = membershipAccess.hasAccess;
    }
  }

  if (!isAuthorized) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 3. İçeriği (PDF) getir ve stream et
  try {
    const response = await fetch(product.product_content);
    
    if (!response.ok) {
      throw new Error('Failed to fetch from original source');
    }

    // PDF içeriğini doğrudan stream olarak döndürüyoruz
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/pdf',
        // İndirmeyi zorlamak yerine tarayıcıda göstermek için inline, 
        // ayrıca gerçek dosya adını gizleyerek sahte bir isim veriyoruz.
        'Content-Disposition': 'inline; filename="document.pdf"',
        // Önbelleğe alınmasın, URL her zaman buradan geçsin
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('PDF proxy fetch error:', error);
    return new NextResponse('Error fetching document', { status: 500 });
  }
}
