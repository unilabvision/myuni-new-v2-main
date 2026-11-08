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

  // 3. Yetki kontrolünden sonra kısa ömürlü bir Storage URL'sine yönlendir.
  // PDF'yi Function üzerinden stream etmek dosyanın tamamını Fast Origin
  // Transfer olarak tekrar ücretlendirir. İmzalı URL dosyayı doğrudan Storage
  // üzerinden teslim ederken private bucket erişimini korur.
  try {
    let bucket = '';
    let objectPath = '';
    if (product.product_content.includes('::')) {
      [bucket, objectPath] = product.product_content.split(/::(.+)/);
    } else {
      const storageUrl = new URL(product.product_content);
      const match = storageUrl.pathname.match(
        /^\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/,
      );
      if (!match) throw new Error('Unsupported product storage reference');
      bucket = decodeURIComponent(match[1]);
      objectPath = decodeURIComponent(match[2]);
    }

    const { data: signed, error: signedUrlError } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(objectPath, 300);
    if (signedUrlError || !signed?.signedUrl) {
      throw signedUrlError || new Error('Product file missing');
    }

    const response = NextResponse.redirect(signed.signedUrl, 307);
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    console.error('PDF proxy fetch error:', error);
    return new NextResponse('Error fetching document', { status: 500 });
  }
}
