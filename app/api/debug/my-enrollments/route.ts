import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * DEBUG ENDPOINT - Kullanıcının ödeme ve enrollment durumunu kontrol eder
 * GET /api/debug/my-enrollments?email=user@example.com
 * 
 * PRODUCTION'DA BU ENDPOINT'İ SİLİN!
 */
export async function GET(request: NextRequest) {
  try {
    // Admin kontrolü için - sadece belirli email'ler erişebilir
    const { userId } = await auth();
    
    const email = request.nextUrl.searchParams.get('email');
    
    if (!email && !userId) {
      return NextResponse.json({ 
        error: 'Email parametresi veya authentication gerekli' 
      }, { status: 400 });
    }

    const searchKey = email || userId;

    // 1. User'ın tüm siparişlerini kontrol et
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .or(`useremail.eq.${email},custom_data->userId.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (ordersError) {
      console.error('Orders fetch error:', ordersError);
    }

    // 2. User'ın tüm enrollment'larını kontrol et
    const userIdToCheck = userId || email;
    const { data: enrollments, error: enrollmentsError } = await supabaseAdmin
      .from('myuni_enrollments')
      .select(`
        id,
        user_id,
        course_id,
        enrolled_at,
        is_active,
        tier_id,
        progress_percentage,
        course:myuni_courses(id, title, slug)
      `)
      .eq('user_id', userIdToCheck)
      .order('enrolled_at', { ascending: false });

    if (enrollmentsError) {
      console.error('Enrollments fetch error:', enrollmentsError);
    }

    // 3. Paket enrollment'larını kontrol et
    const { data: packageEnrollments, error: packageError } = await supabaseAdmin
      .from('myuni_package_enrollments')
      .select(`
        id,
        user_id,
        package_id,
        enrolled_at,
        is_active,
        package:myuni_packages(id, title, slug)
      `)
      .eq('user_id', userIdToCheck)
      .order('enrolled_at', { ascending: false });

    if (packageError) {
      console.error('Package enrollments fetch error:', packageError);
    }

    // 4. Product satın alımlarını kontrol et
    const { data: productPurchases, error: productError } = await supabaseAdmin
      .from('myuni_products_purchases')
      .select(`
        id,
        user_id,
        product_id,
        purchased_at,
        price_paid
      `)
      .eq('user_id', userIdToCheck)
      .order('purchased_at', { ascending: false });

    if (productError) {
      console.error('Product purchases fetch error:', productError);
    }

    // 5. Bekleyen/başarısız siparişleri analiz et
    const completedOrders = orders?.filter(o => o.status === 'completed') || [];
    const pendingOrders = orders?.filter(o => o.status === 'pending') || [];
    const failedOrders = orders?.filter(o => o.status === 'failed') || [];
    const processingOrders = orders?.filter(o => o.status === 'processing') || [];

    // 6. Enrollment eksik olan completed siparişleri bul
    const ordersWithoutEnrollment = completedOrders.filter(order => {
      const courseId = order.courseid;
      const hasEnrollment = enrollments?.some(e => 
        e.course_id === courseId && e.is_active
      );
      return !hasEnrollment && !order.custom_data?.itemType;
    });

    return NextResponse.json({
      debug: {
        searchedBy: email ? 'email' : 'userId',
        searchValue: searchKey,
        timestamp: new Date().toISOString(),
      },
      summary: {
        totalOrders: orders?.length || 0,
        completedOrders: completedOrders.length,
        pendingOrders: pendingOrders.length,
        failedOrders: failedOrders.length,
        processingOrders: processingOrders.length,
        totalEnrollments: enrollments?.length || 0,
        activeEnrollments: enrollments?.filter(e => e.is_active).length || 0,
        inactiveEnrollments: enrollments?.filter(e => !e.is_active).length || 0,
        packageEnrollments: packageEnrollments?.length || 0,
        productPurchases: productPurchases?.length || 0,
        ordersWithoutEnrollment: ordersWithoutEnrollment.length,
      },
      orders: orders?.map(o => ({
        orderId: o.orderid,
        status: o.status,
        courseId: o.courseid,
        courseName: o.coursename,
        amount: o.amount,
        enrolled: o.enrolled,
        enrollmentId: o.enrollmentid,
        createdAt: o.created_at,
        itemType: o.custom_data?.itemType,
        userId: o.custom_data?.userId,
        cartMode: o.custom_data?.cartMode,
      })),
      enrollments: enrollments?.map(e => ({
        id: e.id,
        courseId: e.course_id,
        courseName: e.course?.title,
        courseSlug: e.course?.slug,
        enrolledAt: e.enrolled_at,
        isActive: e.is_active,
        tierId: e.tier_id,
        progress: e.progress_percentage,
      })),
      packageEnrollments: packageEnrollments?.map(pe => ({
        id: pe.id,
        packageId: pe.package_id,
        packageName: pe.package?.title,
        enrolledAt: pe.enrolled_at,
        isActive: pe.is_active,
      })),
      productPurchases: productPurchases?.map(pp => ({
        id: pp.id,
        productId: pp.product_id,
        purchasedAt: pp.purchased_at,
        pricePaid: pp.price_paid,
      })),
      issues: {
        ordersWithoutEnrollment: ordersWithoutEnrollment.map(o => ({
          orderId: o.orderid,
          courseId: o.courseid,
          courseName: o.coursename,
          userId: o.custom_data?.userId,
          userEmail: o.useremail,
          completedAt: o.updated_at,
        })),
      },
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
