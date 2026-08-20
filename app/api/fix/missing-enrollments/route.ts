import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * FIX ENDPOINT - Completed order'ı olan ama enrollment'ı olmayan kullanıcıları düzeltir
 * POST /api/fix/missing-enrollments
 * Body: { email: "user@example.com" } veya authentication ile
 * 
 * PRODUCTION'DA BU ENDPOINT'İ SİLİN veya ADMIN KORUMASI EKLEYİN!
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const email = body.email;

    if (!email && !userId) {
      return NextResponse.json({ 
        error: 'Email veya authentication gerekli' 
      }, { status: 400 });
    }

    const userIdToFix = userId || email;
    const results = {
      fixed: [] as any[],
      errors: [] as any[],
      skipped: [] as any[],
    };

    // 1. Completed siparişleri bul
    const { data: completedOrders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('status', 'completed')
      .or(`useremail.eq.${email},custom_data->userId.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (ordersError) {
      return NextResponse.json({ 
        error: 'Siparişler getirilirken hata',
        details: ordersError 
      }, { status: 500 });
    }

    if (!completedOrders || completedOrders.length === 0) {
      return NextResponse.json({
        message: 'Tamamlanmış sipariş bulunamadı',
        results,
      });
    }

    // 2. Her sipariş için enrollment kontrolü yap
    for (const order of completedOrders) {
      const orderId = order.orderid;
      const courseId = order.courseid;
      const courseName = order.coursename;
      const itemType = order.custom_data?.itemType || 'course';
      const orderUserId = order.custom_data?.userId || order.useremail;

      // Event certificate, product vb. için skip
      if (itemType !== 'course' && itemType !== 'package' && itemType !== 'tier') {
        results.skipped.push({
          orderId,
          reason: `Item type: ${itemType}`,
          courseName,
        });
        continue;
      }

      // Sepet modu için skip (daha karmaşık)
      if (order.custom_data?.cartMode) {
        results.skipped.push({
          orderId,
          reason: 'Cart mode - requires manual review',
          courseName,
        });
        continue;
      }

      try {
        if (itemType === 'course') {
          // Mevcut enrollment var mı kontrol et
          const { data: existingEnrollment } = await supabaseAdmin
            .from('myuni_enrollments')
            .select('id, is_active')
            .eq('user_id', orderUserId)
            .eq('course_id', courseId)
            .maybeSingle();

          if (existingEnrollment) {
            if (!existingEnrollment.is_active) {
              // Pasif enrollment'ı aktif et
              await supabaseAdmin
                .from('myuni_enrollments')
                .update({ 
                  is_active: true,
                  enrolled_at: new Date().toISOString() 
                })
                .eq('id', existingEnrollment.id);

              results.fixed.push({
                orderId,
                courseId,
                courseName,
                action: 'activated_existing',
                enrollmentId: existingEnrollment.id,
              });
            } else {
              results.skipped.push({
                orderId,
                courseId,
                courseName,
                reason: 'Enrollment already active',
              });
            }
          } else {
            // Yeni enrollment oluştur
            const { data: newEnrollment, error: enrollError } = await supabaseAdmin
              .from('myuni_enrollments')
              .insert({
                user_id: orderUserId,
                course_id: courseId,
                enrolled_at: new Date().toISOString(),
                progress_percentage: 0,
                is_active: true,
              })
              .select()
              .single();

            if (enrollError) {
              results.errors.push({
                orderId,
                courseId,
                courseName,
                error: enrollError.message,
              });
            } else {
              // Order'ı güncelle
              await supabaseAdmin
                .from('orders')
                .update({
                  enrolled: true,
                  enrollmentid: newEnrollment.id,
                })
                .eq('orderid', orderId);

              results.fixed.push({
                orderId,
                courseId,
                courseName,
                action: 'created_new',
                enrollmentId: newEnrollment.id,
              });
            }
          }
        } else if (itemType === 'package') {
          const { checkUserPackageEnrollment, enrollUserInPackage } = await import(
            '@/lib/enrollmentService'
          );
          const alreadyEnrolled = await checkUserPackageEnrollment(orderUserId, courseId);
          
          if (!alreadyEnrolled) {
            await enrollUserInPackage(orderUserId, courseId, orderId);
            results.fixed.push({
              orderId,
              packageId: courseId,
              packageName: courseName,
              action: 'enrolled_in_package',
            });
          } else {
            results.skipped.push({
              orderId,
              packageId: courseId,
              packageName: courseName,
              reason: 'Already enrolled in package',
            });
          }
        } else if (itemType === 'tier') {
          const tierId = order.custom_data?.tierId;
          if (!tierId) {
            results.errors.push({
              orderId,
              courseId,
              courseName,
              error: 'Tier ID not found in order',
            });
            continue;
          }

          const { enrollUserInTier } = await import('@/lib/enrollmentService');
          const result = await enrollUserInTier(orderUserId, courseId, tierId);
          
          results.fixed.push({
            orderId,
            courseId,
            courseName,
            tierId,
            action: 'enrolled_in_tier',
            enrollmentId: result.enrollmentId,
          });
        }
      } catch (error) {
        results.errors.push({
          orderId,
          courseId,
          courseName,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      message: 'Düzeltme işlemi tamamlandı',
      summary: {
        totalOrders: completedOrders.length,
        fixed: results.fixed.length,
        skipped: results.skipped.length,
        errors: results.errors.length,
      },
      results,
    });
  } catch (error) {
    console.error('Fix endpoint error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
